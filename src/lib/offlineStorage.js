/**
 * Offline Storage — IndexedDB wrapper for local-first data persistence.
 * Queues mutations when offline and syncs them when connection returns.
 */

const DB_NAME = 'lifetime_wellness_offline';
const DB_VERSION = 2;
const STORES = {
  PENDING_MUTATIONS: 'pending_mutations',
  CACHED_DATA: 'cached_data',
};

let db = null;

async function openDB() {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORES.PENDING_MUTATIONS)) {
        d.createObjectStore(STORES.PENDING_MUTATIONS, { keyPath: 'id', autoIncrement: true });
      }
      if (!d.objectStoreNames.contains(STORES.CACHED_DATA)) {
        d.createObjectStore(STORES.CACHED_DATA, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

// Queue a mutation to run when online
export async function queueMutation(entityName, operation, id, data) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.PENDING_MUTATIONS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_MUTATIONS);
    store.add({ entityName, operation, id, data, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get all pending mutations
export async function getPendingMutations() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.PENDING_MUTATIONS, 'readonly');
    const store = tx.objectStore(STORES.PENDING_MUTATIONS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Delete a mutation after it's synced
export async function deleteMutation(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.PENDING_MUTATIONS, 'readwrite');
    tx.objectStore(STORES.PENDING_MUTATIONS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Cache data locally
export async function cacheData(key, value) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.CACHED_DATA, 'readwrite');
    tx.objectStore(STORES.CACHED_DATA).put({ key, value, cachedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get cached data
export async function getCachedData(key) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES.CACHED_DATA, 'readonly');
    const req = tx.objectStore(STORES.CACHED_DATA).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}
