'use client';

const DB_NAME    = 'monia_ai_cache';
const STORE_NAME = 'responses';
const DB_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CacheEntry {
  key:       string;
  value:     string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const db    = await openDB();
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const entry: CacheEntry | undefined = req.result;
        if (!entry) { resolve(null); return; }
        if (Date.now() - entry.timestamp > MAX_AGE_MS) { resolve(null); return; }
        resolve(entry.value);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string): Promise<void> {
  try {
    const db    = await openDB();
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry: CacheEntry = { key, value, timestamp: Date.now() };
    store.put(entry);
  } catch {}
}

export async function cacheClear(): Promise<void> {
  try {
    const db    = await openDB();
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch {}
}

export function makeCacheKey(prefix: string, input: string): string {
  return `${prefix}::${input.trim().toLowerCase().slice(0, 200)}`;
}
