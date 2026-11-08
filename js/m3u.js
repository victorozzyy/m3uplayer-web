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
