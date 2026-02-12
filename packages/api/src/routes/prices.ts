import { Hono } from "hono";
import { getDb } from "../db/database";
import { runPriceUpdate } from "../services/price-updater";

export const pricesRoute = new Hono();

pricesRoute.get("/prices/:setNum", (c) => {
  const setNum = c.req.param("setNum").trim();
  const db = getDb();
  const row = db
    .query(
      `SELECT set_num, date, source, avg_price, min_price, max_price, currency, total_quantity, fetched_at
       FROM price_history
       WHERE set_num = ?
       ORDER BY date DESC, id DESC
       LIMIT 1`
    )
    .get(setNum) as Record<string, unknown> | null;

  if (!row) {
    return c.json({ error: "No price data found" }, 404);
  }

  return c.json({
    setNum: String(row.set_num),
    date: String(row.date),
    source: String(row.source),
    avgPrice: row.avg_price === null ? null : Number(row.avg_price),
    minPrice: row.min_price === null ? null : Number(row.min_price),
    maxPrice: row.max_price === null ? null : Number(row.max_price),
    currency: String(row.currency),
    totalQuantity: row.total_quantity === null ? null : Number(row.total_quantity),
    fetchedAt: String(row.fetched_at)
  });
});

pricesRoute.get("/prices/:setNum/history", (c) => {
  const setNum = c.req.param("setNum").trim();
  const daysQuery = Number(c.req.query("days") ?? "90");
  const days = Number.isInteger(daysQuery) && daysQuery > 0 ? daysQuery : 90;

  const db = getDb();
  const rows = db
    .query(
      `SELECT set_num, date, source, avg_price, min_price, max_price, currency, total_quantity, fetched_at
       FROM price_history
       WHERE set_num = ? AND date >= date('now', ?)
       ORDER BY date ASC, id ASC`
    )
    .all(setNum, `-${days} day`) as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => ({
      setNum: String(row.set_num),
      date: String(row.date),
      source: String(row.source),
      avgPrice: row.avg_price === null ? null : Number(row.avg_price),
      minPrice: row.min_price === null ? null : Number(row.min_price),
      maxPrice: row.max_price === null ? null : Number(row.max_price),
      currency: String(row.currency),
      totalQuantity: row.total_quantity === null ? null : Number(row.total_quantity),
      fetchedAt: String(row.fetched_at)
    }))
  });
});

pricesRoute.post("/prices/update", async (c) => {
  try {
    let setNums: string[] | undefined;

    try {
      const body = await c.req.json();
      if (body && typeof body.setNum === "string" && body.setNum.trim().length > 0) {
        setNums = [body.setNum.trim()];
      }
      if (body && Array.isArray(body.setNums)) {
        setNums = body.setNums.map((entry: unknown) => String(entry).trim()).filter((entry: string) => entry.length > 0);
      }
    } catch {
      setNums = undefined;
    }

    const summary = await runPriceUpdate({ setNums });
    return c.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price update failed";
    return c.json({ error: message }, 400);
  }
});
