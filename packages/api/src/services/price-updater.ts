import { getDb } from "../db/database";
import { getBricklinkPrice } from "./bricklink";

export type PriceUpdateSummary = {
  updated: number;
  failed: number;
  failures: Array<{ setNum: string; error: string }>;
};

type RunPriceUpdateOptions = {
  setNums?: string[];
  delayMs?: number;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPriceUpdate(options: RunPriceUpdateOptions = {}): Promise<PriceUpdateSummary> {
  const db = getDb();
  const delayMs = options.delayMs ?? 200;
  const targetSetNums = options.setNums && options.setNums.length > 0
    ? options.setNums
    : ((db.query("SELECT DISTINCT set_num FROM inventory ORDER BY set_num").all() as Array<{ set_num: string }>).map(
      (row) => row.set_num
    ));

  const failures: Array<{ setNum: string; error: string }> = [];
  let updated = 0;

  for (const setNum of targetSetNums) {
    try {
      const snapshot = await getBricklinkPrice(setNum);
      db.query(
        `INSERT INTO price_history (
          set_num, date, source, avg_price, min_price, max_price, currency, total_quantity, fetched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(set_num, date, source) DO UPDATE SET
          avg_price = excluded.avg_price,
          min_price = excluded.min_price,
          max_price = excluded.max_price,
          currency = excluded.currency,
          total_quantity = excluded.total_quantity,
          fetched_at = excluded.fetched_at`
      ).run(
        setNum,
        todayDateString(),
        snapshot.source,
        snapshot.avgPrice,
        snapshot.minPrice,
        snapshot.maxPrice,
        snapshot.currency,
        snapshot.totalQuantity,
        snapshot.fetchedAt
      );
      updated += 1;
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : "Unknown error";
      failures.push({ setNum, error });
    }

    await sleep(delayMs);
  }

  db.query(
    `INSERT INTO app_config (key, value, updated_at)
     VALUES ('last_price_update', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(new Date().toISOString());

  return {
    updated,
    failed: failures.length,
    failures
  };
}
