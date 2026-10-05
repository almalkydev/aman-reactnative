import type { Pending } from "./types";
// Browser preview uses IndexedDB; iOS and Android use SQLite.
let database: Promise<IDBDatabase> | null = null;
function db() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const r = indexedDB.open("aman", 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("cache");
        r.result.createObjectStore("queue", { keyPath: "id" });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  return database;
}
async function operation(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<any> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, mode);
    const r = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(r.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function readCache<T>(key: string): Promise<T | null> {
  return (await operation("cache", "readonly", (s) => s.get(key))) ?? null;
}
export async function writeCache(key: string, value: unknown) {
  await operation("cache", "readwrite", (s) => s.put(value, key));
}
export async function savePending(row: Pending) {
  await operation("queue", "readwrite", (s) => s.add(row));
}
export async function pending(user: number): Promise<Pending[]> {
  const rows: Pending[] = await operation("queue", "readonly", (s) =>
    s.getAll(),
  );
  return rows.filter((r) => r.user_id === user && !r.synced);
}
export async function updatePending(
  id: string,
  payload: string,
  synced: number,
) {
  const row = await operation("queue", "readonly", (s) => s.get(id));
  await operation("queue", "readwrite", (s) =>
    s.put({ ...row, payload, synced }),
  );
}
