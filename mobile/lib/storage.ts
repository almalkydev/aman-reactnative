import * as SQLite from "expo-sqlite";
import type { Pending } from "./types";
let database: Promise<SQLite.SQLiteDatabase> | null = null;
async function db() {
  if (!database)
    database = (async () => {
      const value = await SQLite.openDatabaseAsync("aman.db");
      await value.execAsync(
        "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS cache(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS queue(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,synced INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);",
      );
      return value;
    })();
  return database;
}
export async function readCache<T>(key: string): Promise<T | null> {
  const row = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM cache WHERE key=?",
    key,
  );
  return row ? JSON.parse(row.value) : null;
}
export async function writeCache(key: string, value: unknown) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO cache(key,value) VALUES(?,?)",
    key,
    JSON.stringify(value),
  );
}
export async function savePending(row: Pending) {
  await (
    await db()
  ).runAsync(
    "INSERT INTO queue(id,user_id,kind,payload,synced,created_at) VALUES(?,?,?,?,0,?)",
    row.id,
    row.user_id,
    row.kind,
    row.payload,
    row.created_at,
  );
}
export async function pending(user: number) {
  return (await db()).getAllAsync<Pending>(
    "SELECT * FROM queue WHERE user_id=? AND synced=0 ORDER BY created_at",
    user,
  );
}
export async function updatePending(
  id: string,
  payload: string,
  synced: number,
) {
  await (
    await db()
  ).runAsync(
    "UPDATE queue SET payload=?,synced=? WHERE id=?",
    payload,
    synced,
    id,
  );
}
