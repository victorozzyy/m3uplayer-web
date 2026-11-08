#!/usr/bin/env node
'use strict';
/**
 * Proxy local para IPTV (sem dependências, Node >= 18)
 *   /stream?url=...[&seg=direct][&ua=...]  streaming com Range; reescreve manifests HLS
 *   /raw?url=...[&nocache=1]               listas M3U / API Xtream (com cache em memória)
 *   /health   /cache/clear (POST)
 * Também serve a UI (../index.html, css/, js/) em http://localhost:PORT
 */
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const dns = require('dns');
const net = require('net');
const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const DEFAULT_UA = process.env.UA || 'VLC/3.0.20 LibVLC/3.0.20';
const ALLOW_PRIVATE = process.env.ALLOW_PRIVATE === '1';
const INSECURE_TLS = process.env.INSECURE_TLS === '1';
const CACHE_TTL = (Number(process.env.CACHE_TTL) || 600) * 1000;
const CACHE_MAX = (Number(process.env.CACHE_MAX_MB) || 200) * 1024 * 1024;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://victorozzyy.github.io')
  .split(',').map((s) => s.trim()).filter(Boolean);
const WEB_ROOT = path.resolve(__dirname, '..');
const MANIFEST_LIMIT = 8 * 1024 * 1024;
const RAW_LIMIT = 200 * 1024 * 1024;

const httpError = (status, message) => Object.assign(new Error(message), { status });

/* ---------- segurança ---------- */
function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const h = new URL(origin).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  } catch { return false; }
}

function isPrivateIp(ip) {
  if (ip.includes(':')) {
    const l = ip.toLowerCase();
    if (l === '::1' || l === '::') return true;
    if (l.startsWith('::ffff:')) { const r = l.slice(7); return r.includes(':') ? true : isPrivateIp(r); }
    return /^f[cd]/.test(l) || /^fe[89ab]/.test(l);
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return cb(err);
    const list = Array.isArray(address) ? address : [{ address }];
    if (!ALLOW_PRIVATE && list.some((a) => isPrivateIp(a.address)))
      return cb(httpError(403, 'Destino em rede privada bloqueado (use ALLOW_PRIVATE=1 para liberar)'));
    cb(null, address, family);
  });
}

/* ---------- upstream ---------- */
function upstream(urlStr, opts = {}) {
  const { headers = {}, method = 'GET', redirects = 6, signal } = opts;
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(urlStr); } catch { return reject(httpError(400, 'URL inválida')); }
    if (!/^https?:$/.test(u.protocol)) return reject(httpError(400, 'Protocolo não suportado'));
    const bare = u.hostname.replace(/^\[|\]$/g, '');
    if (!ALLOW_PRIVATE && net.isIP(bare) && isPrivateIp(bare))
      return reject(httpError(403, 'Destino em rede privada bloqueado'));

    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(u, {
      method, headers, signal, lookup: safeLookup, rejectUnauthorized: !INSECURE_TLS, timeout: 30000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects <= 0) return reject(httpError(508, 'Redirecionamentos demais'));
        return resolve(upstream(new URL(res.headers.location, u).href, { ...opts, redirects: redirects - 1 }));
      }
      res.finalUrl = u.href;
      resolve(res);
    });
    req.on('timeout', () => req.destroy(httpError(504, 'Tempo esgotado no servidor de origem')));
    req.on('error', reject);
    req.end();
  });
}

function upstreamHeaders(req, ua, forwardRange) {
  const h = { 'User-Agent': ua || DEFAULT_UA, Accept: '*/*', 'Accept-Encoding': 'identity' };
  if (forwardRange && req.headers.range) h.Range = req.headers.range;
  return h;
}

function readBody(stream, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    stream.on('data', (c) => {
      size += c.length;
      if (size > limit) { stream.destroy(); return reject(httpError(413, 'Resposta grande demais')); }
      chunks.push(c);
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    stream.on('close', () => reject(httpError(502, 'Conexão encerrada pela origem')));
  });
}

function decode(buf, enc) {
  enc = (enc || '').toLowerCase();
  if (enc === 'gzip' || enc === 'x-gzip') return zlib.gunzipSync(buf);
  if (enc === 'deflate') return zlib.inflateSync(buf);
  if (enc === 'br') return zlib.brotliDecompressSync(buf);
  return buf;
}

function peekStart(stream) {
  return new Promise((resolve, reject) => {
    const cleanup = () => { stream.off('data', onData); stream.off('end', onEnd); stream.off('error', onErr); };
    const onData = (chunk) => { cleanup(); stream.pause(); stream.unshift(chunk); resolve(chunk.subarray(0, 32).toString('latin1')); };
    const onEnd = () => { cleanup(); resolve(''); };
    const onErr = (e) => { cleanup(); reject(e); };
    stream.on('data', onData); stream.once('end', onEnd); stream.once('error', onErr);
  });
}

/* ---------- cache ---------- */
const cache = new Map();
let cacheBytes = 0;
function cacheDel(k) { const e = cache.get(k); if (e) { cacheBytes -= e.body.length; cache.delete(k); } }
function cacheGet(k) {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { cacheDel(k); return null; }
  return e;
}
function cacheSet(k, entry) {
  if (entry.body.length > CACHE_MAX / 2) return;
  cacheDel(k);
  cache.set(k, entry);
  cacheBytes += entry.body.length;
  for (const key of cache.keys()) { if (cacheBytes <= CACHE_MAX) break; cacheDel(key); }
}

/* ---------- reescrita de manifest HLS ---------- */
function rewriteManifest(text, baseUrl, ctx) {
  const wrap = (abs, kind) => {
    if (kind === 'segment' && ctx.seg === 'direct') return abs;
    let q = `url=${encodeURIComponent(abs)}`;
    if (ctx.seg === 'direct') q += '&seg=direct';
    if (ctx.ua) q += `&ua=${encodeURIComponent(ctx.ua)}`;
    return `${ctx.origin}/stream?${q}`;
  };
  const abs = (u) => { try { return new URL(u, baseUrl).href; } catch { return u; } };
  const kindOfUrl = (a, def) => (/\.m3u8(\?|$)/i.test(a.split('#')[0]) ? 'playlist' : def);

  let nextIsVariant = false;
  return text.split(/\r?\n/).map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (t.startsWith('#')) {
      if (t.startsWith('#EXT-X-STREAM-INF')) nextIsVariant = true;
      return line.replace(/URI="([^"]*)"/g, (m, uri) => {
        if (!uri || uri.startsWith('data:')) return m;
        let kind = 'segment';
        if (/^#EXT-X-(MEDIA|I-FRAME-STREAM-INF|RENDITION-REPORT)/.test(t)) kind = 'playlist';
        else if (/^#EXT-X-(SESSION-)?KEY/.test(t)) kind = 'key';
        const a = abs(uri);
        return `URI="${wrap(a, kind === 'segment' ? kindOfUrl(a, 'segment') : kind)}"`;
      });
    }
    const a = abs(t);
    const kind = nextIsVariant ? 'playlist' : kindOfUrl(a, 'segment');
    nextIsVariant = false;
    return wrap(a, kind);
  }).join('\n');
}

/* ---------- handlers ---------- */
const hostOf = (u) => { try { return new URL(u).host; } catch { return '?'; } };
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

async function handleRaw(req, res, u) {
  const target = u.searchParams.get('url');
  if (!target) throw httpError(400, 'Parâmetro url ausente');
  const ua = u.searchParams.get('ua') || '';
  if (u.searchParams.get('nocache') !== '1') {
    const hit = cacheGet(target);
    if (hit) {
      log('RAW  HIT ', hostOf(target));
      res.writeHead(200, { 'content-type': hit.type, 'x-cache': 'HIT', 'cache-control': 'no-store' });
      return res.end(hit.body);
    }
  }
  log('RAW  MISS', hostOf(target));
  const ac = new AbortController();
  res.on('close', () => ac.abort());
  const up = await upstream(target, { headers: upstreamHeaders(req, ua, false), signal: ac.signal });
  const body = decode(await readBody(up, RAW_LIMIT), up.headers['content-encoding']);
  const type = up.headers['content-type'] || 'application/octet-stream';
  if (up.statusCode === 200) cacheSet(target, { ts: Date.now(), type, body });
  res.writeHead(up.statusCode, { 'content-type': type, 'x-cache': 'MISS', 'cache-control': 'no-store' });
  res.end(body);
}

async function handleStream(req, res, u, selfOrigin) {
  const target = u.searchParams.get('url');
  if (!target) throw httpError(400, 'Parâmetro url ausente');
  const ua = u.searchParams.get('ua') || '';
  const seg = u.searchParams.get('seg') === 'direct' ? 'direct' : 'full';

  const ac = new AbortController();
  res.on('close', () => ac.abort());
  const up = await upstream(target, { headers: upstreamHeaders(req, ua, true), signal: ac.signal });

  const ct = (up.headers['content-type'] || '').toLowerCase();
  const finalUrl = up.finalUrl;
  let maybeManifest = up.statusCode === 200 && !req.headers.range;

  if (maybeManifest && !/mpegurl/.test(ct)) {
    const byExt = /\.m3u8(\?|$)/i.test(finalUrl);
    const ambiguous = !ct || /octet-stream|text\/plain|force-download/.test(ct);
    maybeManifest = false;
    if (byExt || ambiguous) maybeManifest = (await peekStart(up)).includes('#EXTM3U');
  }

  if (maybeManifest) {
    const raw = decode(await readBody(up, MANIFEST_LIMIT), up.headers['content-encoding']);
    const text = raw.toString('utf8');
    if (/^\s*#EXTM3U/.test(text) && /#EXT-X-/.test(text)) {
      const out = rewriteManifest(text, finalUrl, { origin: selfOrigin, ua, seg });
      log('HLS  manifest', hostOf(finalUrl), `(${seg})`);
      res.writeHead(200, { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-store' });
      return res.end(out);
    }
    res.writeHead(up.statusCode, { 'content-type': up.headers['content-type'] || 'text/plain', 'cache-control': 'no-store' });
    return res.end(raw);
  }

  const h = {};
  for (const k of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-encoding', 'last-modified', 'etag'])
    if (up.headers[k]) h[k] = up.headers[k];
  h['cache-control'] = up.headers['cache-control'] || 'no-store';
  res.writeHead(up.statusCode, h);
  if (req.method === 'HEAD') { up.destroy(); return res.end(); }
  up.on('error', () => res.destroy());
  up.pipe(res);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
function serveStatic(req, res, u) {
  let p = decodeURIComponent(u.pathname);
  if (p === '/') p = '/index.html';
  if (!/^\/(index\.html|css\/|js\/|assets\/)/.test(p)) throw httpError(404, 'Não encontrado');
  const file = path.join(WEB_ROOT, p);
  if (!file.startsWith(WEB_ROOT + path.sep)) throw httpError(403, 'Proibido');
  fs.readFile(file, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'Arquivo não encontrado' });
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(data);
  });
}

function friendly(e) {
  const map = {
    ENOTFOUND: 'Servidor de origem não encontrado (DNS)',
    ECONNREFUSED: 'Conexão recusada pelo servidor de origem',
    ECONNRESET: 'Conexão interrompida pelo servidor de origem',
    ETIMEDOUT: 'Tempo esgotado ao conectar na origem',
  };
  if (map[e.code]) return map[e.code];
  if (/CERT|SSL|TLS/i.test(e.code || '')) return `Certificado TLS inválido na origem (${e.code}). Use INSECURE_TLS=1 se confiar nela.`;
  return e.message || 'Erro desconhecido';
}

async function handler(req, res) {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const origin = req.headers.origin;

  if (!originAllowed(origin)) return sendJson(res, 403, { error: `Origin não permitida: ${origin}. Ajuste ALLOWED_ORIGINS.` });

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, X-Cache');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Range, Content-Type',
      'Access-Control-Max-Age': '600',
    });
    return res.end();
  }

  const selfOrigin = process.env.PUBLIC_URL || `${USE_TLS ? 'https' : 'http'}://${req.headers.host}`;
  try {
    switch (u.pathname) {
      case '/health':
        return sendJson(res, 200, { ok: true, name: 'iptv-proxy', version: VERSION, uptime: Math.round(process.uptime()),
          cache: { entries: cache.size, bytes: cacheBytes } });
      case '/cache/clear': {
        const n = cache.size; cache.clear(); cacheBytes = 0;
        log('cache limpo', n);
        return sendJson(res, 200, { ok: true, cleared: n });
      }
      case '/raw': return await handleRaw(req, res, u);
      case '/stream': return await handleStream(req, res, u, selfOrigin);
      default: return serveStatic(req, res, u);
    }
  } catch (e) {
    if (res.headersSent) return res.destroy();
    if (e.name === 'AbortError' || e.code === 'ABORT_ERR') return res.end();
    const status = e.status || 502;
    log('ERRO', status, friendly(e));
    sendJson(res, status, { error: friendly(e) });
  }
}

const USE_TLS = !!(process.env.SSL_KEY && process.env.SSL_CERT);
const server = USE_TLS
  ? https.createServer({ key: fs.readFileSync(process.env.SSL_KEY), cert: fs.readFileSync(process.env.SSL_CERT) }, handler)
  : http.createServer(handler);

server.listen(PORT, HOST, () => {
  console.log(`IPTV proxy v${VERSION} em ${USE_TLS ? 'https' : 'http'}://${HOST}:${PORT}`);
  console.log(`Origins permitidas: ${ALLOWED_ORIGINS.join(', ')} (+ localhost)`);
  if (INSECURE_TLS) console.log('⚠ INSECURE_TLS ativo: certificados da origem não são validados');
});
