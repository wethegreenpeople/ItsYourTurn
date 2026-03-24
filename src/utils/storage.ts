/**
 * Cross-platform persistent key-value storage.
 * Tries @tauri-apps/plugin-store first (Tauri desktop builds),
 * falls back to localStorage for web.
 */

type TauriStore = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
};

let _store: TauriStore | null = null;
let _initDone = false;

async function getStore(): Promise<TauriStore | null> {
  if (_initDone) return _store;
  _initDone = true;
  try {
    const mod = await import(/* @vite-ignore */ "@tauri-apps/plugin-store");
    _store = await (mod.Store as any).load("tcg-data.json", { autoSave: true });
    return _store;
  } catch {
    return null;
  }
}

const NS = "tcg:";

export async function storageGet<T>(key: string): Promise<T | null> {
  const store = await getStore();
  if (store) return store.get<T>(key);
  const raw = localStorage.getItem(NS + key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  // Always write to localStorage as a synchronous cache so module-level
  // reads (e.g. savedGamesStore seed) see fresh data on the next cold start,
  // even in Tauri builds where the primary store is the plugin file store.
  localStorage.setItem(NS + key, JSON.stringify(value));
  const store = await getStore();
  if (store) await store.set(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  const store = await getStore();
  if (store) { await store.delete(key); return; }
  localStorage.removeItem(NS + key);
}
