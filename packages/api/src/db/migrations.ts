import type { Database } from "bun:sqlite";
import { schemaSql } from "./schema";

export function runMigrations(db: Database): void {
  for (const statement of schemaSql) {
    db.run(statement);
  }
}
