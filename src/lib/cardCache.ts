import Database from "@tauri-apps/plugin-sql";

export interface CachedCard {
  riftbound_id: string;
  name: string;
  image_url: string;
}

// Internal row shape stored in both backends
interface StoredCard extends CachedCard {
  clean_name: string;
  cached_at: number;
}

// ---------------------------------------------------------------------------
// Backend interface
// ---------------------------------------------------------------------------

interface CardCacheBackend {
  getById(riftbound_id: string): Promise<CachedCard | null>;
  getByName(name: string): Promise<CachedCard | null>;
  put(card: CachedCard): Promise<void>;
}

// ---------------------------------------------------------------------------
// Tauri SQLite backend
// ---------------------------------------------------------------------------

class TauriSqlBackend implements CardCacheBackend {
  private db: Database | null = null;

  async init(): Promise<void> {
    this.db = await Database.load("sqlite:cards.db");
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS card_cache (
        riftbound_id TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        clean_name   TEXT NOT NULL,
        image_url    TEXT NOT NULL,
        cached_at    INTEGER NOT NULL
      )
    `);
    await this.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_clean_name ON card_cache(clean_name)`
    );
  }

  async getById(riftbound_id: string): Promise<CachedCard | null> {
    const rows = await this.db!.select<CachedCard[]>(
      "SELECT riftbound_id, name, image_url FROM card_cache WHERE riftbound_id = $1",
      [riftbound_id]
    );
    return rows[0] ?? null;
  }

  async getByName(name: string): Promise<CachedCard | null> {
    const rows = await this.db!.select<CachedCard[]>(
      "SELECT riftbound_id, name, image_url FROM card_cache WHERE clean_name = $1",
      [name.toLowerCase().trim()]
    );
    return rows[0] ?? null;
  }

  async put(card: CachedCard): Promise<void> {
    await this.db!.execute(
      `INSERT OR REPLACE INTO card_cache
         (riftbound_id, name, clean_name, image_url, cached_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [card.riftbound_id, card.name, card.name.toLowerCase().trim(), card.image_url, Date.now()]
    );
  }
}

// ---------------------------------------------------------------------------
// IndexedDB backend (browser / fallback)
// ---------------------------------------------------------------------------

const IDB_NAME = "riftbound-cards";
const IDB_STORE = "card_cache";

class IndexedDbBackend implements CardCacheBackend {
  private db: IDBDatabase | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(IDB_STORE, {
          keyPath: "riftbound_id",
        });
        store.createIndex("clean_name", "clean_name", { unique: false });
      };
      req.onsuccess = () => { this.db = req.result; resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  }

  async getById(riftbound_id: string): Promise<CachedCard | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const req = db
        .transaction(IDB_STORE, "readonly")
        .objectStore(IDB_STORE)
        .get(riftbound_id);
      req.onsuccess = () => resolve(req.result ? toPublic(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  }

  async getByName(name: string): Promise<CachedCard | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const req = db
        .transaction(IDB_STORE, "readonly")
        .objectStore(IDB_STORE)
        .index("clean_name")
        .get(name.toLowerCase().trim());
      req.onsuccess = () => resolve(req.result ? toPublic(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  }

  async put(card: CachedCard): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const stored: StoredCard = {
        ...card,
        clean_name: card.name.toLowerCase().trim(),
        cached_at: Date.now(),
      };
      const req = db
        .transaction(IDB_STORE, "readwrite")
        .objectStore(IDB_STORE)
        .put(stored);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

function toPublic(row: StoredCard): CachedCard {
  return { riftbound_id: row.riftbound_id, name: row.name, image_url: row.image_url };
}

// ---------------------------------------------------------------------------
// Backend selection — Tauri SQL when available, IndexedDB everywhere else
// ---------------------------------------------------------------------------

let backend: CardCacheBackend | null = null;

async function getBackend(): Promise<CardCacheBackend> {
  if (backend) return backend;

  if ("__TAURI_INTERNALS__" in window) {
    try {
      const b = new TauriSqlBackend();
      await b.init();
      backend = b;
      return backend;
    } catch (e) {
      console.warn("[cardCache] Tauri SQL unavailable, using IndexedDB:", e);
    }
  }

  backend = new IndexedDbBackend();
  return backend;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCachedById(riftbound_id: string): Promise<CachedCard | null> {
  try { return await (await getBackend()).getById(riftbound_id); }
  catch { return null; }
}

export async function getCachedByName(name: string): Promise<CachedCard | null> {
  try { return await (await getBackend()).getByName(name); }
  catch { return null; }
}

export async function putCached(card: CachedCard): Promise<void> {
  try { await (await getBackend()).put(card); }
  catch { /* non-fatal */ }
}
