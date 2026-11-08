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
