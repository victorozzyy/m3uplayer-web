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
