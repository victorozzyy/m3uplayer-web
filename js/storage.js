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
