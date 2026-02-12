import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runMigrations } from "./migrations";

const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH ?? "data/legoeater.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

runMigrations(db);

export function getDb(): Database {
  return db;
}
