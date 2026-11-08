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
