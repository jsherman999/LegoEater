import { Hono } from "hono";
import { getDb } from "../db/database";

export const healthRoute = new Hono();

healthRoute.get("/health", (c) => {
  const db = getDb();
  const one = db.query("SELECT 1 as ok").get() as { ok: number };

  return c.json({
    status: "ok",
    database: one.ok === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});
