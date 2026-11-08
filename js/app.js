import { settings, saveSettings, store } from './config.js';
import * as Sources from './sources.js';
import { buildGetUrl } from './xtream.js';
import { Player } from './player.js';
import { imageUrl, testProxy, clearProxyCache } from './net.js';
import { $, $$, h, toast } from './ui.js';

const CHUNK = 80;
const LABELS = { live: 'canais ao vivo', movies: 'filmes', series: 'séries' };

const state = {
  defs: [], source: null, provider: null,
  section: 'live', data: {}, cat: 'all', query: '',
  series: null,        // { item, loading?, info?, season? }
  playingId: null, episodeCtx: null, current: null,
};

const video = $('#video');
const player = new Player(video, {
  onStatus: (m) => setStatus(m),
  onError: (m) => setStatus(`Erro durante a reprodução: ${m}`, true),
  onEnded: () => playNextEpisode(),
});

/* ================= util ================= */
function setStatus(text, err = false) {
  const el = $('#nowStatus');
  el.textContent = text;
  el.classList.toggle('err', err);
}
function showOverlay(text) {
  const o = $('#videoOverlay');
  o.textContent = text || '';
  o.classList.toggle('hidden', !text);
}
function markActive() {
  $$('[data-key].active').forEach((e) => e.classList.remove('active'));
  if (state.playingId) document.querySelector(`[data-key="${CSS.escape(state.playingId)}"]`)?.classList.add('active');
}
function logoImg(url, cls) {
  const ph = () => h('div', { class: `${cls} ph` }, '▶');
  if (!url) return ph();
  const img = h('img', { class: cls, loading: 'lazy', alt: '', referrerpolicy: 'no-referrer', src: imageUrl(url) });
  img.onerror = () => img.replaceWith(ph());
  return img;
}
function prepare(d) {
  d.counts = new Map();
  for (const it of d.items) {
    it._n = (it.name || '').toLowerCase();
    d.counts.set(it.cat, (d.counts.get(it.cat) || 0) + 1);
  }
  return d;
}
function friendlyError(e, url) {
  if (location.protocol === 'https:' && /^http:\/\//i.test(url))
    return `Este servidor só oferece http e o navegador bloqueia vídeo http em página https (${e.message}). Use "Copiar link" e abra no VLC.`;
  if (/\.(mkv|avi|wmv|flv)(\?|$)/i.test(url))
    return `Formato não suportado pelo navegador (${e.message}). Use "Copiar link" e abra no VLC.`;
  return `${e.message}. Tente outro tipo de proxy em ⚙ ou limpe o cache.`;
}

/* ================= listas ================= */
function renderSourceSelect() {
  const sel = $('#sourceSelect');
  sel.replaceChildren();
  const groups = [
    ['Listas padrão (GitHub)', state.defs.filter((d) => d.origin === 'index')],
    ['Minhas listas', state.defs.filter((d) => d.origin !== 'index')],
  ];
  for (const [label, list] of groups) {
    if (!list.length) continue;
    const og = h('optgroup', { label });
    for (const d of list) og.append(h('option', { value: d.id }, d.name));
    sel.append(og);
  }
}

async function refreshSources(force = false) {
  let indexDefs = [];
  try {
    const r = await Sources.loadIndex({ force });
    indexDefs = r.defs;
    if (r.stale) toast('Sem acesso ao índice de listas; usando a cópia em cache.', 'warn');
  } catch (e) {
    toast(`Não consegui ler o índice de listas: ${e.message}`, 'error', 8000);
  }
  const ids = new Set(indexDefs.map((d) => d.id));
  state.defs = [...indexDefs, ...[...Sources.getUserLists(), ...Sources.getTempLists()].filter((d) => !ids.has(d.id))];
  renderSourceSelect();

  const wanted = state.source?.id || store.get('lastSource');
  const pick = state.defs.find((d) => d.id === wanted) || state.defs[0];
  if (pick) await selectSource(pick.id, { force });
  else {
    state.provider = null;
    renderCategories();
    $('#content').replaceChildren(h('div', { class: 'empty' }, 'Nenhuma lista disponível. Use "+ Lista" para adicionar uma.'));
  }
}

async function selectSource(id, { force = false } = {}) {
  const def = state.defs.find((d) => d.id === id);
  if (!def) return;
  state.source = def;
  state.provider = Sources.createProvider(def);
  state.data = {}; state.cat = 'all'; state.query = ''; state.series = null;
  $('#search').value = '';
  $('#sourceSelect').value = id;
  $('#btnRemoveList').hidden = def.origin === 'index';
  store.set('lastSource', id);

  if (def.xtream && state.provider.mode === 'xtream') {
    const prov = state.provider;
    prov.account().then((ui) => {
      if (!ui || prov !== state.provider) return;
      const exp = Number(ui.exp_date) ? new Date(ui.exp_date * 1000).toLocaleDateString('pt-BR') : 'sem validade';
      toast(`Conta ${ui.status || 'ativa'} · expira: ${exp} · conexões ${ui.active_cons ?? '?'}/${ui.max_connections ?? '?'}`, 'ok');
    }).catch(() => {});
  }
  await showSection(state.section, { force });
}

/* ================= seções / categorias ================= */
async function showSection(section, { force = false } = {}) {
  state.section = section; state.cat = 'all'; state.series = null;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.section === section));
  const prov = state.provider;
  if (!prov) return;

  if (!state.data[section] || force) {
    $('#categories').replaceChildren();
    $('#content').replaceChildren(h('div', { class: 'empty' }, `Carregando ${LABELS[section]}…`));
    try {
      const d = await prov.load(section, { force });
      if (prov !== state.provider) return;
      state.data[section] = prepare(d);
      if (prov.fellBack) { toast('API Xtream indisponível; lista lida via M3U.', 'warn'); prov.fellBack = null; }
    } catch (e) {
      if (prov !== state.provider || state.section !== section) return;
      $('#content').replaceChildren(h('div', { class: 'error-box' },
        h('p', {}, e.message),
        h('button', { class: 'btn', onclick: () => showSection(section, { force: true }) }, 'Tentar novamente'),
        ' ',
        h('button', { class: 'btn', onclick: openSettings }, 'Proxy / cache')));
      return;
    }
  }
  if (state.section !== section) return;
  renderCategories();
  renderItems();
}

function renderCategories() {
  const box = $('#categories');
  box.replaceChildren();
  const d = state.data[state.section];
  if (!d) return;
  const btn = (id, name, n) => h('button', {
    class: 'cat' + (state.cat === id ? ' active' : ''),
    onclick: () => { state.cat = id; state.series = null; renderCategories(); renderItems(); },
  }, h('span', {}, name), h('small', {}, n));
  box.append(btn('all', 'Todos', d.items.length));
  for (const c of d.categories) {
    const n = d.counts.get(c.id);
    if (n) box.append(btn(c.id, c.name, n));
  }
}

/* ================= itens (com rolagem incremental) ================= */
let rs = { list: [], idx: 0, grid: null };
const sentinelObserver = new IntersectionObserver((entries) => {
  if (entries.some((e) => e.isIntersecting)) appendChunk();
}, { rootMargin: '500px' });

function filtered() {
  const d = state.data[state.section];
  if (!d) return [];
  const q = state.query.trim().toLowerCase();
  return d.items.filter((i) => (state.cat === 'all' || i.cat === state.cat) && (!q || i._n.includes(q)));
}

function renderItems() {
  sentinelObserver.disconnect();
  const box = $('#content');
  box.replaceChildren();
  if (state.series) return renderSeriesDetail();

  const list = filtered();
  if (!list.length) { box.append(h('div', { class: 'empty' }, 'Nada encontrado.')); return; }
  const grid = h('div', { class: `grid ${state.section === 'live' ? 'list' : 'posters'}` });
  const sentinel = h('div', { style: 'height:1px' });
  box.append(h('div', { class: 'result-info' }, `${list.length} itens`), grid, sentinel);
  rs = { list, idx: 0, grid, sentinel };
  appendChunk();
}

function appendChunk() {
  const { list, idx, grid, sentinel } = rs;
  if (!grid || idx >= list.length) return;
  const end = Math.min(idx + CHUNK, list.length);
  const frag = document.createDocumentFragment();
  for (let i = idx; i < end; i++) frag.append(card(list[i]));
  grid.append(frag);
  rs.idx = end;
  sentinelObserver.unobserve(sentinel);
  if (end < list.length) sentinelObserver.observe(sentinel); // reavalia se ainda está visível
}

function card(item) {
  const section = state.section;
  if (section === 'live') {
    const key = `live:${item.id}`;
    return h('button', {
      class: 'row' + (state.playingId === key ? ' active' : ''), dataset: { key },
      onclick: () => playItem(item),
    }, logoImg(item.logo, 'ch-logo'), h('span', { class: 'row-name' }, item.name));
  }
  const meta = [item.year, Number(item.rating) > 0 ? `★ ${item.rating}` : ''].filter(Boolean).join(' · ');
  return h('button', {
    class: 'poster', title: item.name,
    onclick: () => (section === 'series' ? openSeries(item) : playItem(item)),
  }, h('div', { class: 'poster-img' }, logoImg(item.logo, 'poster-cover')),
     h('div', { class: 'poster-title' }, item.name),
     meta ? h('div', { class: 'poster-meta' }, meta) : null);
}

/* ================= séries ================= */
async function openSeries(item) {
  state.series = { item, loading: true };
  renderItems();
  try {
    const info = await state.provider.seriesInfo(item);
    if (state.series?.item !== item) return;
    state.series = { item, info, season: info.seasons[0]?.number };
  } catch (e) {
    if (state.series?.item !== item) return;
    state.series = null;
    toast(`Não foi possível carregar a série: ${e.message}`, 'error', 7000);
  }
  renderItems();
}

function renderSeriesDetail() {
  const box = $('#content');
  const s = state.series;
  const back = h('button', { class: 'btn', onclick: () => { state.series = null; renderItems(); } }, '← Voltar');
  if (s.loading) { box.append(back, h('div', { class: 'empty' }, 'Carregando episódios…')); return; }

  const { item, info } = s;
  const meta = info.info;
  const cover = meta.cover || item.logo;
  const sub = [meta.year || item.year, meta.genre, (meta.rating || item.rating) ? `★ ${meta.rating || item.rating}` : ''].filter(Boolean).join(' · ');
  box.append(back, h('div', { class: 'series-head' },
    logoImg(cover, 'cover'),
    h('div', {}, h('h2', {}, item.name), h('div', { class: 'poster-meta' }, sub),
      (meta.plot || item.plot) ? h('p', {}, meta.plot || item.plot) : null)));

  if (!info.seasons.length) { box.append(h('div', { class: 'empty' }, 'Sem episódios disponíveis.')); return; }

  box.append(h('div', { class: 'chips' }, info.seasons.map((se) => h('button', {
    class: 'chip' + (se.number === s.season ? ' active' : ''),
    onclick: () => { s.season = se.number; renderItems(); },
  }, `Temporada ${se.number}`))));

  const flat = info.seasons.flatMap((x) => x.episodes);
  const season = info.seasons.find((x) => x.number === s.season) || info.seasons[0];
  const ctx = { item, flat };
  box.append(h('div', {}, season.episodes.map((ep) => {
    const key = `ep:${ep.id}`;
    return h('button', {
      class: 'ep' + (state.playingId === key ? ' active' : ''), dataset: { key },
      onclick: () => playEpisode(ctx, ep),
    }, h('span', { class: 'ep-num' }, `E${ep.num || '?'}`), h('span', { class: 'ep-title' }, ep.title),
       ep.duration ? h('span', { class: 'ep-dur' }, ep.duration) : null);
  })));
}

function playEpisode(ctx, ep) {
  state.episodeCtx = { ...ctx, id: ep.id };
  startPlayback({
    title: `${ctx.item.name} — T${ep.season}E${ep.num || '?'} · ${ep.title}`,
    urls: [ep.url], live: false, key: `ep:${ep.id}`,
  });
}
function playNextEpisode() {
  const c = state.episodeCtx;
  if (!c) return;
  const i = c.flat.findIndex((e) => e.id === c.id);
  const next = c.flat[i + 1];
  if (next) playEpisode(c, next);
}

/* ================= reprodução ================= */
function playItem(item) {
  state.episodeCtx = null;
  const urls = state.provider.playUrls(item, state.section);
  if (!urls.length) { toast('Item sem URL de reprodução', 'error'); return; }
  startPlayback({ title: item.name, urls, live: state.section === 'live', key: `${state.section}:${item.id}` });
}

async function startPlayback({ title, urls, live, key }) {
  state.playingId = key;
  state.current = { title, url: urls[0] };
  $('#nowTitle').textContent = title;
  showOverlay('');
  markActive();
  try {
    await player.play({ urls, live });
  } catch (e) {
    setStatus(friendlyError(e, urls[0]), true);
    showOverlay('Não foi possível reproduzir');
  }
}

/* ================= diálogo: adicionar lista ================= */
const dlgAdd = $('#dlgAdd'), formAdd = $('#formAdd');

function syncAddType() {
  const t = formAdd.elements.type.value;
  $$('[data-type]', formAdd).forEach((p) => (p.hidden = p.dataset.type !== t));
  formAdd.elements.save.disabled = t === 'text';
  if (t === 'text') formAdd.elements.save.checked = true;
}

formAdd.elements.file.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (f) formAdd.elements.text.value = await f.text();
});

formAdd.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formAdd.elements;
  const type = f.type.value, name = f.name.value.trim();
  const persist = f.save.checked;
  const origin = persist ? 'user' : 'temp';
  let def, text;
  try {
    if (type === 'url') {
      const url = f.url.value.trim();
      if (!/^https?:\/\//i.test(url)) throw new Error('Informe uma URL http(s) válida');
      def = Sources.makeDef({ name, url, origin });
    } else if (type === 'xtream') {
      let server = f.server.value.trim();
      const username = f.username.value.trim(), password = f.password.value.trim();
      if (!server || !username || !password) throw new Error('Preencha servidor, usuário e senha');
      if (!/^https?:\/\//i.test(server)) server = 'http://' + server;
      server = server.replace(/\/(player_api|get)\.php.*$/i, '').replace(/\/+$/, '');
      const xtream = { server, username, password };
      def = Sources.makeDef({ name, url: buildGetUrl(xtream), xtream, origin });
    } else {
      text = f.text.value;
      if (!/#EXTM3U|#EXTINF/.test(text.slice(0, 4096))) throw new Error('Conteúdo não parece uma lista M3U');
      def = Sources.makeDef({ name, textKey: 'text:' + Sources.hash(text.slice(0, 5000) + text.length), origin: 'user' });
    }
  } catch (err) { toast(err.message, 'error'); return; }

  await Sources.addList(def, { persist: type === 'text' ? true : persist, text });
  dlgAdd.close();
  formAdd.reset();
  syncAddType();
  if (!state.defs.some((d) => d.id === def.id)) state.defs.push(def);
  renderSourceSelect();
  await selectSource(def.id);
  toast(`Lista "${def.name}" adicionada`, 'ok');
});

/* ================= diálogo: proxy e cache ================= */
const dlgSet = $('#dlgSettings'), formSet = $('#formSettings');

function openSettings() {
  const f = formSet.elements;
  f.proxyMode.value = settings.proxyMode;
  f.proxyBase.value = settings.proxyBase;
  f.customTemplate.value = settings.customTemplate;
  f.userAgent.value = settings.userAgent;
  f.liveFormat.value = settings.liveFormat;
  f.preferApi.checked = settings.preferApi;
  f.cacheTtl.value = settings.cacheTtlMin;
  f.indexUrl.value = settings.indexUrl;
  f.useWebProxy.checked = settings.useWebProxy;
  f.webProxy.value = settings.webProxy;
  setProxyStatus('');
  if (!dlgSet.open) dlgSet.showModal();
}
function setProxyStatus(msg, cls = '') {
  const el = $('#proxyStatus');
  el.textContent = msg;
  el.className = 'status ' + cls;
}

formSet.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formSet.elements;
  const oldIndex = settings.indexUrl, oldApi = settings.preferApi;
  saveSettings({
    proxyMode: f.proxyMode.value,
    proxyBase: f.proxyBase.value.trim() || 'http://localhost:8080',
    customTemplate: f.customTemplate.value.trim(),
    userAgent: f.userAgent.value.trim(),
    liveFormat: f.liveFormat.value,
    preferApi: f.preferApi.checked,
    cacheTtlMin: Math.max(0, Number(f.cacheTtl.value) || 0),
    indexUrl: f.indexUrl.value.trim() || settings.indexUrl,
    useWebProxy: f.useWebProxy.checked,
    webProxy: f.webProxy.value.trim() || settings.webProxy,
  });
  dlgSet.close();
  toast('Configurações salvas', 'ok');
  if (settings.indexUrl !== oldIndex) await refreshSources(true);
  else if (settings.preferApi !== oldApi && state.source) await selectSource(state.source.id);
});

$('#btnTestProxy').addEventListener('click', async () => {
  saveSettings({ proxyBase: formSet.elements.proxyBase.value.trim() || settings.proxyBase });
  setProxyStatus('Testando…');
  try {
    const r = await testProxy();
    setProxyStatus(`✔ Proxy OK · v${r.version} · ${r.ms} ms · cache: ${r.cache.entries} itens`, 'ok');
  } catch (e) {
    setProxyStatus(`✖ Sem resposta do proxy (${e.message}). Rode "node proxy/server.js" e permita o acesso à rede local no navegador.`, 'err');
  }
});

$('#btnClearCache').addEventListener('click', async () => {
  player.stop();
  showOverlay('Cache limpo. Selecione um conteúdo.');
  await Sources.clearCache();
  let proxyMsg = '';
  try { const r = await clearProxyCache(); proxyMsg = ` · proxy: ${r.cleared} itens`; }
  catch { proxyMsg = ' · proxy local não respondeu (ignorado)'; }
  setProxyStatus(`✔ Cache do app limpo${proxyMsg}`, 'ok');
  toast('Cache limpo', 'ok');
  if (state.source) { state.playingId = null; await selectSource(state.source.id, { force: true }); }
});
$('#btnCloseSettings').addEventListener('click', () => dlgSet.close());

/* ================= eventos gerais ================= */
function bind() {
  $$('.tab').forEach((t) => t.addEventListener('click', () => showSection(t.dataset.section)));

  let timer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.query = e.target.value; state.series = null; renderItems(); }, 200);
  });

  $('#sourceSelect').addEventListener('change', (e) => selectSource(e.target.value));
  $('#btnReload').addEventListener('click', () => refreshSources(true));
  $('#btnSettings').addEventListener('click', openSettings);
  $('#btnAddList').addEventListener('click', () => { syncAddType(); dlgAdd.showModal(); });
  $('#addCancel').addEventListener('click', () => dlgAdd.close());
  $('#addType').addEventListener('change', syncAddType);

  $('#btnRemoveList').addEventListener('click', async () => {
    const d = state.source;
    if (!d || d.origin === 'index' || !confirm(`Remover a lista "${d.name}"?`)) return;
    await Sources.removeList(d);
    state.source = null;
    await refreshSources();
  });

  $('#btnStop').addEventListener('click', () => {
    player.stop(); state.playingId = null; state.episodeCtx = null;
    $('#nowTitle').textContent = '—'; setStatus('');
    showOverlay('Selecione um conteúdo para assistir'); markActive();
  });
  $('#btnCopy').addEventListener('click', async () => {
    if (!state.current) return;
    try { await navigator.clipboard.writeText(state.current.url); toast('Link copiado', 'ok'); }
    catch { prompt('Copie o link:', state.current.url); }
  });
}

bind();
syncAddType();
refreshSources();
