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
