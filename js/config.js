export const DEFAULT_INDEX_URL =
  'https://github.com/victorozzyy/m3uplayer-web/blob/main/playlists2/listaauto004.m3u';

const KEY = 'iptv.settings.v1';

export const DEFAULTS = {
  indexUrl: DEFAULT_INDEX_URL,
  proxyMode: 'auto',               // auto | direct | local | local-manifest | custom
  proxyBase: 'http://localhost:8080',
  customTemplate: '',
  userAgent: '',
  liveFormat: 'm3u8',              // m3u8 | ts
  preferApi: true,
  cacheTtlMin: 360,
};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export const settings = { ...DEFAULTS, ...load() };

export function saveSettings(patch) {
  Object.assign(settings, patch);
  localStorage.setItem(KEY, JSON.stringify(settings));
}

// pequeno helper de localStorage com JSON
export const store = {
  get(k, def = null) {
    try { const v = localStorage.getItem('iptv.' + k); return v == null ? def : JSON.parse(v); } catch { return def; }
  },
  set(k, v) { try { localStorage.setItem('iptv.' + k, JSON.stringify(v)); } catch {} },
};

// github.com/.../blob/... -> raw.githubusercontent.com/...
export function normalizeGithubUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'github.com') {
      const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/);
      if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
    }
  } catch {}
  return url;
}
```

## `js/storage.js`

```js
// IndexedDB simples (chave/valor). Falhas (modo privado, cota) são ignoradas.
const DB = 'iptv-player', STORE = 'kv';
let dbp;

function db() {
  return (dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}

async function tx(mode, fn) {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const t = d.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = t.onabort = () => reject(t.error);
    });
  } catch (e) {
    console.warn('IndexedDB:', e);
    return undefined;
  }
}

export const kvGet = (k) => tx('readonly', (s) => s.get(k));
export const kvSet = (k, v) => tx('readwrite', (s) => s.put(v, k));
export const kvDel = (k) => tx('readwrite', (s) => s.delete(k));
export const kvClearPrefix = (p) =>
  tx('readwrite', (s) => s.delete(IDBKeyRange.bound(p, p + '\uffff')));
```

## `js/net.js`

```js
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
    default: // auto
      return PAGE_HTTPS && isHttp(url) ? [full] : [direct, full];
  }
}

export function imageUrl(u) {
  if (!u) return '';
  if (PAGE_HTTPS && isHttp(u) && ['auto', 'local', 'local-manifest'].includes(settings.proxyMode))
    return viaLocal('stream', u);
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
          ? (r.proxied ? `proxy inacessível em ${base()} (rodando? navegador permitiu acesso à rede local?)` : 'bloqueado por CORS/rede')
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
```

## `js/m3u.js`

```js
function parseExtinf(line) {
  const attrs = {};
  let end = line.indexOf(':') + 1;
  const re = /([\w-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(line))) { attrs[m[1].toLowerCase()] = m[2]; end = re.lastIndex; }
  const comma = line.indexOf(',', end);
  return { attrs, name: comma >= 0 ? line.slice(comma + 1).trim() : '' };
}

function nameFromUrl(u) {
  try { return decodeURIComponent(new URL(u).pathname.split('/').filter(Boolean).pop() || u); } catch { return u; }
}

export function parseM3U(text) {
  const entries = [];
  let pending = null;
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF')) { pending = parseExtinf(line); continue; }
    if (line.startsWith('#EXTGRP:')) { pending ??= { attrs: {}, name: '' }; pending.group = line.slice(8).trim(); continue; }
    if (line.startsWith('#')) continue;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(line)) continue;
    const p = pending || { attrs: {}, name: '' };
    entries.push({
      name: p.name || p.attrs['tvg-name'] || nameFromUrl(line),
      url: line,
      logo: p.attrs['tvg-logo'] || '',
      group: (p.attrs['group-title'] || p.group || '').trim(),
    });
    pending = null;
  }
  return entries;
}

/** Lê o "índice de listas": uma URL por linha (aceita "Nome | URL" ou #EXTINF antes da URL). */
export function parseListIndex(text) {
  const out = [], seen = new Set();
  let pending = '';
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { pending = ''; continue; }
    if (line.startsWith('#EXTINF')) { pending = parseExtinf(line).name; continue; }
    if (line.startsWith('#') || line.startsWith('//')) continue;
    let name = pending, url = line;
    const m = line.match(/^(.+?)\s*[|;]\s*(https?:\/\/\S+)$/i);
    if (m) { name = m[1]; url = m[2]; }
    pending = '';
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ name, url });
  }
  return out;
}

const SXE = /^(.*?)[\s._\-–:]*S(\d{1,2})\s*[._-]?\s*E(\d{1,3})/i;
const SERIES_GROUP = /s[ée]rie|season|temporada|novela|anime|doram/i;
const VOD_GROUP = /filme|movie|vod|cinema|lan[cç]amento|document[aá]rio/i;

function classify(e) {
  const u = e.url;
  if (/\/series\/[^/]+\/[^/]+\/\d+/i.test(u)) return 'series';
  if (/\/movie\/[^/]+\/[^/]+\/\d+/i.test(u)) return 'movies';
  if (/\/live\/[^/]+\/[^/]+\/\d+/i.test(u)) return 'live';
  const liveExt = /\.(m3u8|ts)(\?|#|$)/i.test(u);
  const vodExt = /\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v)(\?|#|$)/i.test(u);
  if (!liveExt && SXE.test(e.name)) return 'series';
  if (vodExt || (!liveExt && VOD_GROUP.test(e.group))) return SERIES_GROUP.test(e.group) ? 'series' : 'movies';
  return 'live';
}

/** Converte entradas M3U em { live, movies, series } -> { categories, items } */
export function buildCatalog(entries) {
  const mk = () => ({ cats: new Set(), items: [] });
  const sec = { live: mk(), movies: mk(), series: mk() };
  const seriesMap = new Map();
  let n = 0;

  for (const e of entries) {
    const kind = classify(e);
    const cat = e.group || 'Sem categoria';
    const s = sec[kind];
    s.cats.add(cat);

    if (kind === 'series') {
      const m = SXE.exec(e.name);
      const title = ((m ? m[1] : e.name).trim().replace(/[-–:]+$/, '').trim()) || e.name;
      const season = m ? +m[2] : 1, num = m ? +m[3] : 0;
      const key = title.toLowerCase();
      let ser = seriesMap.get(key);
      if (!ser) {
        ser = { kind, id: 'ms' + seriesMap.size, name: title, logo: e.logo, cat, seasons: {} };
        seriesMap.set(key, ser);
        s.items.push(ser);
      }
      (ser.seasons[season] ??= []).push({ id: 'e' + n++, title: e.name, num, season, url: e.url, img: e.logo });
    } else {
      s.items.push({ kind, id: 'm' + n++, name: e.name, logo: e.logo, cat, url: e.url });
    }
  }

  for (const ser of seriesMap.values())
    for (const eps of Object.values(ser.seasons)) if (eps.every((x) => x.num > 0)) eps.sort((a, b) => a.num - b.num);

  const out = {};
  for (const [k, v] of Object.entries(sec))
    out[k] = { categories: [...v.cats].map((name) => ({ id: name, name })), items: v.items };
  return out;
}
```

## `js/xtream.js`

```js
import { fetchJson } from './net.js';
import { settings } from './config.js';

const enc = encodeURIComponent;
const s = (v) => (v == null ? '' : String(v));

export function detectXtream(urlStr) {
  try {
    const u = new URL(urlStr);
    const username = u.searchParams.get('username');
    const password = u.searchParams.get('password');
    if (username && password && /\/(get|player_api|panel_api)\.php$/i.test(u.pathname)) {
      return { server: u.origin + u.pathname.replace(/\/[^/]*$/, ''), username, password };
    }
  } catch {}
  return null;
}

export function buildGetUrl({ server, username, password }) {
  return `${server}/get.php?username=${enc(username)}&password=${enc(password)}&type=m3u_plus`;
}

const API = {
  live:   { cats: 'get_live_categories',   list: 'get_live_streams' },
  movies: { cats: 'get_vod_categories',    list: 'get_vod_streams' },
  series: { cats: 'get_series_categories', list: 'get_series' },
};

export class XtreamClient {
  constructor({ server, username, password }) {
    this.server = server.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
  }

  apiUrl(action, extra = {}) {
    const p = new URLSearchParams({ username: this.username, password: this.password });
    if (action) p.set('action', action);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `${this.server}/player_api.php?${p}`;
  }
  call(action, extra, opts) { return fetchJson(this.apiUrl(action, extra), opts); }

  async account(opts) {
    const j = await this.call('', {}, opts);
    const ui = j?.user_info;
    if (!ui) throw new Error('Resposta inválida do servidor Xtream');
    if (String(ui.auth) === '0') throw new Error('Login Xtream recusado (usuário/senha inválidos ou conta expirada)');
    return ui;
  }

  async section(section, opts) {
    const api = API[section];
    const [rawCats, rawList] = await Promise.all([this.call(api.cats, {}, opts), this.call(api.list, {}, opts)]);
    if (!Array.isArray(rawCats) || !Array.isArray(rawList))
      throw new Error('A API Xtream não retornou listas para esta seção');

    const categories = rawCats.map((c) => ({ id: s(c.category_id), name: s(c.category_name) || 'Sem nome' }));
    const known = new Set(categories.map((c) => c.id));
    const items = rawList.map((it) => this.normalize(section, it));
    for (const it of items) if (!known.has(it.cat)) { known.add(it.cat); categories.push({ id: it.cat, name: 'Sem categoria' }); }
    return { categories, items };
  }

  normalize(section, it) {
    const cat = s(it.category_id || '0');
    if (section === 'live')
      return { kind: 'live', id: s(it.stream_id), name: s(it.name), logo: s(it.stream_icon), cat };
    if (section === 'movies')
      return { kind: 'movies', id: s(it.stream_id), name: s(it.name), logo: s(it.stream_icon), cat,
        ext: s(it.container_extension) || 'mp4', rating: s(it.rating_5based || it.rating), year: s(it.year) };
    return { kind: 'series', id: s(it.series_id), name: s(it.name), logo: s(it.cover), cat,
      plot: s(it.plot), rating: s(it.rating), year: s(it.year || it.releaseDate || it.release_date).slice(0, 4) };
  }

  base(kind) { return `${this.server}/${kind}/${enc(this.username)}/${enc(this.password)}`; }
  liveUrls(id) {
    const m = `${this.base('live')}/${id}.m3u8`, t = `${this.base('live')}/${id}.ts`;
    return settings.liveFormat === 'ts' ? [t, m] : [m, t];
  }
  movieUrl(id, ext) { return `${this.base('movie')}/${id}.${ext || 'mp4'}`; }
  episodeUrl(id, ext) { return `${this.base('series')}/${id}.${ext || 'mp4'}`; }

  async seriesInfo(id, opts) {
    const j = await this.call('get_series_info', { series_id: id }, opts);
    if (!j || typeof j !== 'object' || !j.episodes) throw new Error('Série sem informações de episódios');
    let groups = j.episodes;
    if (Array.isArray(groups)) {
      const m = {};
      for (const e of groups.flat()) (m[e.season || 1] ??= []).push(e);
      groups = m;
    }
    const seasons = Object.keys(groups).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
      .map((n) => ({
        number: n,
        episodes: groups[n].map((e) => ({
          id: s(e.id),
          title: s(e.title) || `Episódio ${e.episode_num}`,
          num: Number(e.episode_num) || 0,
          season: n,
          img: s(e.info?.movie_image),
          plot: s(e.info?.plot),
          duration: s(e.info?.duration),
          url: this.episodeUrl(e.id, e.container_extension),
        })).sort((a, b) => a.num - b.num),
      }));
    const i = j.info || {};
    return {
      info: { name: s(i.name), cover: s(i.cover), plot: s(i.plot), genre: s(i.genre),
        year: s(i.releaseDate || i.release_date).slice(0, 4), rating: s(i.rating) },
      seasons,
    };
  }
}
```

## `js/sources.js`

```js
import { settings, store, normalizeGithubUrl } from './config.js';
import { fetchText } from './net.js';
import { kvGet, kvSet, kvDel, kvClearPrefix } from './storage.js';
import { parseListIndex, parseM3U, buildCatalog } from './m3u.js';
import { XtreamClient, detectXtream } from './xtream.js';

export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function defaultName({ xtream, url }) {
  try {
    if (xtream) return `${new URL(xtream.server).host} · ${xtream.username}`;
    if (url) { const u = new URL(url); return u.host + u.pathname.replace(/\/$/, '').replace(/^.*\//, '/…/'); }
  } catch {}
  return 'Lista';
}

/** Definição normalizada de lista */
export function makeDef({ name, url, xtream, textKey, origin }) {
  const x = xtream || (url ? detectXtream(url) : null);
  const id = hash(textKey || (x ? `${x.server}|${x.username}` : url));
  return { id, name: name || (textKey ? 'Lista colada' : defaultName({ xtream: x, url })), url, xtream: x, textKey, origin };
}

/* ---------- índice (arquivo no GitHub com as listas) ---------- */
export async function loadIndex({ force = false } = {}) {
  const url = normalizeGithubUrl(settings.indexUrl);
  const key = 'cache:index:' + hash(url);
  let text, stale = false;
  try {
    text = await fetchText(url, { nocache: force, timeout: 30000 });
    await kvSet(key, text);
  } catch (e) {
    text = await kvGet(key);
    if (!text) throw e;
    stale = true;
  }
  const defs = parseListIndex(text).map((e) => makeDef({ name: e.name, url: e.url, origin: 'index' }));
  return { defs, stale };
}

/* ---------- listas do usuário ---------- */
const tempLists = [];
export const getUserLists = () => store.get('userLists', []);
export const getTempLists = () => tempLists;

export async function addList(def, { persist = true, text } = {}) {
  if (text) await kvSet(def.textKey, text);
  if (persist) {
    const all = getUserLists().filter((d) => d.id !== def.id);
    all.push(def);
    store.set('userLists', all);
  } else if (!tempLists.some((d) => d.id === def.id)) tempLists.push(def);
}

export async function removeList(def) {
  store.set('userLists', getUserLists().filter((d) => d.id !== def.id));
  const i = tempLists.findIndex((d) => d.id === def.id);
  if (i >= 0) tempLists.splice(i, 1);
  if (def.textKey) await kvDel(def.textKey);
  await kvClearPrefix(`cache:m3u:${def.id}`);
  await kvClearPrefix(`cache:x:${def.id}`);
}

export const clearCache = () => kvClearPrefix('cache:');

/* ---------- provider (Xtream API com fallback para M3U) ---------- */
function liveCandidates(url) {
  const m = url.match(/^(.*\/live\/[^/]+\/[^/]+\/[^/.?]+)\.(?:ts|m3u8)(\?.*)?$/i);
  if (!m) return [url];
  const q = m[2] || '';
  const hls = `${m[1]}.m3u8${q}`, ts = `${m[1]}.ts${q}`;
  return settings.liveFormat === 'ts' ? [ts, hls] : [hls, ts];
}

export function createProvider(def) {
  const x = def.xtream ? new XtreamClient(def.xtream) : null;
  const hasM3u = !!(def.url || def.textKey);
  const p = { def, mode: x && settings.preferApi ? 'xtream' : 'm3u' };
  let m3uMem = null;
  const seriesCache = new Map();
  const ttl = () => Math.max(0, settings.cacheTtlMin) * 60000;

  async function cached(key, force, producer) {
    const old = await kvGet(key);
    if (!force && old && Date.now() - old.ts < ttl()) return old.data;
    try {
      const data = await producer();
      await kvSet(key, { ts: Date.now(), data });
      return data;
    } catch (e) {
      if (!force && old) { console.warn('Usando cache expirado:', e); return old.data; }
      throw e;
    }
  }

  async function loadM3u(force) {
    const produce = async () => {
      const text = def.textKey ? await kvGet(def.textKey) : await fetchText(def.url, { nocache: force });
      if (!text || !/#EXTM3U|#EXTINF/.test(text.slice(0, 4096)))
        throw new Error('O conteúdo não parece uma lista M3U (login inválido, bloqueio do provedor ou resposta de erro).');
      const entries = parseM3U(text);
      if (!entries.length) throw new Error('Lista M3U sem itens');
      return buildCatalog(entries);
    };
    return def.textKey ? produce() : cached(`cache:m3u:${def.id}`, force, produce);
  }

  p.load = async (section, { force = false } = {}) => {
    if (p.mode === 'xtream') {
      try {
        return await cached(`cache:x:${def.id}:${section}`, force, () => x.section(section, { nocache: force }));
      } catch (e) {
        if (!hasM3u) throw e;
        console.warn('API Xtream falhou, usando M3U:', e);
        p.mode = 'm3u';
        p.fellBack = e.message;
      }
    }
    if (!m3uMem || force) m3uMem = await loadM3u(force);
    return m3uMem[section];
  };

  p.account = () => (x ? x.account() : Promise.resolve(null));

  p.seriesInfo = async (item) => {
    if (item.seasons) { // veio de M3U
      const seasons = Object.keys(item.seasons).map(Number).sort((a, b) => a - b)
        .map((n) => ({ number: n, episodes: item.seasons[n] }));
      return { info: { name: item.name, cover: item.logo, plot: '', genre: '', year: '', rating: '' }, seasons };
    }
    if (!seriesCache.has(item.id)) seriesCache.set(item.id, await x.seriesInfo(item.id));
    return seriesCache.get(item.id);
  };

  p.playUrls = (item, section) => {
    if (item.url) return section === 'live' ? liveCandidates(item.url) : [item.url];
    if (!x) return [];
    return section === 'live' ? x.liveUrls(item.id) : [x.movieUrl(item.id, item.ext)];
  };

  return p;
}
```

## `js/player.js`

```js
import { routes } from './net.js';

const START_TIMEOUT = 20000;

function kindsOf(url, live) {
  const p = url.split(/[?#]/)[0].toLowerCase();
  if (p.endsWith('.m3u8')) return ['hls'];
  if (p.endsWith('.ts')) return ['ts'];
  if (/\.(mp4|m4v|webm|mov|mkv|avi|mp3|aac|flv)$/.test(p)) return ['file'];
  return live ? ['hls', 'ts'] : ['file'];
}

function mediaError(v) {
  const c = v.error?.code;
  const msg = { 1: 'abortado', 2: 'erro de rede', 3: 'erro de decodificação', 4: 'formato/codec não suportado pelo navegador' }[c] || 'erro desconhecido';
  return new Error(`Vídeo: ${msg}`);
}

export class Player {
  constructor(video, cb = {}) {
    this.v = video;
    this.cb = cb;
    this.token = 0;
    this.hls = null;
    this.ts = null;
    this.ac = null;
    video.addEventListener('ended', () => cb.onEnded?.());
  }

  stop() { this.token++; this._teardown(); }

  _teardown() {
    this.ac?.abort(); this.ac = null;
    if (this.hls) { try { this.hls.destroy(); } catch {} this.hls = null; }
    if (this.ts) { try { this.ts.pause(); this.ts.unload(); this.ts.detachMediaElement(); this.ts.destroy(); } catch {} this.ts = null; }
    this.v.pause();
    this.v.removeAttribute('src');
    this.v.load();
  }

  /** Tenta cada (url × rota × tipo) até funcionar. Retorna a tentativa vencedora ou null se cancelado. */
  async play({ urls, live }) {
    const token = ++this.token;
    this._teardown();

    const attempts = [];
    for (const orig of urls)
      for (const route of routes(orig))
        for (const kind of kindsOf(orig, live)) attempts.push({ orig, route, kind });

    let lastErr;
    for (let i = 0; i < attempts.length; i++) {
      if (token !== this.token) return null;
      const a = attempts[i];
      this.cb.onStatus?.(`Conectando (${i + 1}/${attempts.length}) · ${a.route.label} · ${a.kind.toUpperCase()}…`);
      try {
        await this._try(a, live);
        if (token !== this.token) return null;
        this.cb.onStatus?.(`Reproduzindo · ${a.route.label} · ${a.kind.toUpperCase()}`);
        return a;
      } catch (e) {
        if (token !== this.token) return null;
        lastErr = e;
        this._teardown();
      }
    }
    throw lastErr || new Error('Nenhuma fonte disponível');
  }

  _try({ route, kind }, live) {
    const v = this.v;
    const ac = (this.ac = new AbortController());
    const { signal } = ac;

    return new Promise((resolve, reject) => {
      let started = false;
      const timer = setTimeout(() => fail(new Error('Tempo esgotado ao iniciar')), START_TIMEOUT);
      const ok = () => { if (started) return; started = true; clearTimeout(timer); resolve(); };
      const fail = (err) => {
        if (started) { this.cb.onError?.(err.message); return; }
        clearTimeout(timer); reject(err);
      };
      signal.addEventListener('abort', () => { clearTimeout(timer); if (!started) reject(new Error('cancelado')); });
      v.addEventListener('canplay', ok, { signal });
      v.addEventListener('playing', ok, { signal });
      v.addEventListener('error', () => fail(mediaError(v)), { signal });

      if (kind === 'hls') {
        if (window.Hls?.isSupported()) {
          const hls = (this.hls = new Hls({
            enableWorker: true, lowLatencyMode: false, maxBufferLength: 30,
            manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 3,
          }));
          let netRetry = 0, mediaRetry = 0;
          hls.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
          hls.on(Hls.Events.ERROR, (_, d) => {
            if (!d.fatal) return;
            if (started) {
              if (d.type === Hls.ErrorTypes.NETWORK_ERROR && netRetry++ < 3) return hls.startLoad();
              if (d.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetry++ < 3) return hls.recoverMediaError();
            }
            const code = d.response?.code ? ` (HTTP ${d.response.code})` : '';
            fail(new Error(`HLS ${d.type}: ${d.details}${code}`));
          });
          hls.loadSource(route.url);
          hls.attachMedia(v);
        } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
          v.src = route.url; v.play().catch(() => {});
        } else fail(new Error('Este navegador não suporta HLS'));
      } else if (kind === 'ts') {
        if (window.mpegts?.isSupported()) {
          const p = (this.ts = mpegts.createPlayer(
            { type: 'mpegts', isLive: !!live, url: route.url },
            { enableWorker: true, liveBufferLatencyChasing: !!live },
          ));
          p.on(mpegts.Events.ERROR, (type, detail) => fail(new Error(`MPEG-TS ${type}: ${detail}`)));
          p.attachMediaElement(v);
          p.load();
          Promise.resolve(p.play()).catch(() => {});
        } else fail(new Error('Este navegador não suporta MPEG-TS (MSE)'));
      } else {
        v.src = route.url;
        v.play().catch(() => {});
      }
    });
  }
}
```

## `js/ui.js`

```js
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Criador de elementos (sempre textContent: sem risco de XSS com nomes vindos das listas) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat())
    if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

export function toast(msg, type = 'info', ms = 4500) {
  const t = h('div', { class: `toast ${type}` }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), ms);
}
