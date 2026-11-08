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
