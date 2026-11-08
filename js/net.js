import { settings } from './config.js';

const PAGE_HTTPS = location.protocol === 'https:';
const isHttp = (u) => /^http:\/\//i.test(u);
const base = () => (settings.proxyBase || '').replace(/\/+$/, '');

function qs(obj) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null && v !== '') p.set(k, v);
  return p.toString();
}
const viaLocal = (endpoint, url, extra = {}) =>
  `${base()}/${endpoint}?${qs({ url, ua: settings.userAgent, ...extra })}`;
const viaCustom = (url) => settings.customTemplate.replace('{url}', encodeURIComponent(url));

// http://host[:80]/... -> https://host/... (null se não der para tentar)
function upgrade(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== 'http:' || (x.port && x.port !== '80')) return null;
    x.protocol = 'https:'; x.port = '';
    return x.href;
  } catch { return null; }
}

/**
 * Rotas candidatas para uma URL, em ordem de tentativa.
 * kind 'stream' -> /stream (reescreve manifest HLS); 'data' -> /raw (listas e API, com cache)
 */
export function routes(url, { kind = 'stream' } = {}) {
  const ep = kind === 'data' ? 'raw' : 'stream';
  const direct = { url, label: 'direto', proxied: false };
  const full = { url: viaLocal(ep, url), label: 'proxy local', proxied: true };
  switch (settings.proxyMode) {
    case 'direct': return [direct];
    case 'local': return [full];
    case 'local-manifest':
      return [kind === 'data' ? full
        : { url: viaLocal(ep, url, { seg: 'direct' }), label: 'proxy local (manifest)', proxied: true }];
    case 'custom':
      return settings.customTemplate.includes('{url}')
        ? [{ url: viaCustom(url), label: 'proxy personalizado', proxied: true }] : [direct];
    default: { // auto
      if (!PAGE_HTTPS) return [direct, full];
      if (!isHttp(url)) return [direct];
      // página https + link http: o navegador bloqueia o acesso direto
      const out = [];
      const up = upgrade(url);
      if (up) out.push({ url: up, label: 'https', proxied: false });
      if (kind === 'data' && settings.useWebProxy && (settings.webProxy || '').includes('{url}'))
        out.push({ url: settings.webProxy.replace('{url}', encodeURIComponent(url)), label: 'proxy web', proxied: true });
      if (!out.length) out.push(direct);
      return out;
    }
  }
}

export function imageUrl(u) {
  if (!u) return '';
  if (PAGE_HTTPS && isHttp(u)) {
    if (['local', 'local-manifest'].includes(settings.proxyMode)) return viaLocal('stream', u);
    if (settings.proxyMode === 'auto') return `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=300`;
  }
  return u;
}

async function errorMessage(res) {
  let msg = `HTTP ${res.status}`;
  try { const j = await res.clone().json(); if (j?.error) msg += ` — ${j.error}`; } catch {}
  return msg;
}

export async function fetchText(url, { nocache = false, timeout = 120000 } = {}) {
  let lastErr;
  for (const r of routes(url, { kind: 'data' })) {
    const target = nocache && r.proxied && r.url.startsWith(base()) ? r.url + '&nocache=1' : r.url;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    try {
      const res = await fetch(target, { signal: ac.signal, cache: nocache ? 'reload' : 'default' });
      if (!res.ok) throw new Error(await errorMessage(res));
      return await res.text();
    } catch (e) {
      const why = e.name === 'AbortError' ? 'tempo esgotado'
        : e instanceof TypeError
          ? (r.label === 'proxy local' ? `proxy local inacessível em ${base()}`
            : r.label === 'proxy web' ? 'proxy web indisponível ou bloqueado'
            : r.label === 'https' ? 'servidor sem https' : 'bloqueado por CORS/rede')
          : e.message;
      lastErr = new Error(`Falha (${r.label}): ${why}`);
    } finally { clearTimeout(timer); }
  }
  throw lastErr;
}

export async function fetchJson(url, opts) {
  const text = await fetchText(url, opts);
  try { return JSON.parse(text); }
  catch { throw new Error('A resposta não é JSON válido (login errado, bloqueio do provedor ou proxy inadequado).'); }
}

export async function testProxy() {
  const t0 = performance.now();
  const res = await fetch(`${base()}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await errorMessage(res));
  return { ...(await res.json()), ms: Math.round(performance.now() - t0) };
}

export async function clearProxyCache() {
  const res = await fetch(`${base()}/cache/clear`, { method: 'POST' });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}
