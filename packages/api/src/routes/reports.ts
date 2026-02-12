import { Hono } from "hono";
import { getDb } from "../db/database";

export const reportsRoute = new Hono();

reportsRoute.get("/reports/summary", (c) => {
  const db = getDb();
  const row = db
    .query(
      `SELECT
         COUNT(*) AS total_sets,
         COALESCE(SUM(i.quantity), 0) AS total_quantity,
         COALESCE(SUM(i.quantity * COALESCE(i.purchase_price, 0)), 0) AS total_invested,
         COALESCE(
           SUM(
             i.quantity * COALESCE((
               SELECT ph.avg_price
               FROM price_history ph
               WHERE ph.set_num = i.set_num
               ORDER BY ph.date DESC, ph.id DESC
               LIMIT 1
             ), 0)
           ),
           0
         ) AS total_value
       FROM inventory i`
    )
    .get() as {
    total_sets: number;
    total_quantity: number;
    total_invested: number;
    total_value: number;
  };

  const gainLoss = row.total_value - row.total_invested;
  const roi = row.total_invested > 0 ? (gainLoss / row.total_invested) * 100 : 0;

  return c.json({
    totalSets: row.total_sets,
    totalQuantity: row.total_quantity,
    totalInvested: row.total_invested,
    totalValue: row.total_value,
    gainLoss,
    roi
  });
});

reportsRoute.get("/reports/by-member", (c) => {
  const db = getDb();
  const rows = db
    .query(
      `SELECT
         COALESCE(fm.id, 0) AS member_id,
         COALESCE(fm.name, 'Unassigned') AS member_name,
         COUNT(i.id) AS set_count,
         COALESCE(SUM(i.quantity), 0) AS total_quantity,
         COALESCE(SUM(i.quantity * COALESCE(i.purchase_price, 0)), 0) AS invested,
         COALESCE(
           SUM(
             i.quantity * COALESCE((
               SELECT ph.avg_price
               FROM price_history ph
               WHERE ph.set_num = i.set_num
               ORDER BY ph.date DESC, ph.id DESC
               LIMIT 1
             ), 0)
           ),
           0
         ) AS value
       FROM inventory i
       LEFT JOIN family_members fm ON fm.id = i.owner_id
       GROUP BY member_id, member_name
       ORDER BY value DESC, member_name ASC`
    )
    .all() as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => ({
      memberId: Number(row.member_id),
      memberName: String(row.member_name),
      setCount: Number(row.set_count),
      totalQuantity: Number(row.total_quantity),
      invested: Number(row.invested),
      value: Number(row.value),
      gainLoss: Number(row.value) - Number(row.invested)
    }))
  });
});

reportsRoute.get("/reports/by-theme", (c) => {
  const db = getDb();
  const rows = db
    .query(
      `SELECT
         COALESCE(sc.theme_name, 'Unknown') AS theme_name,
         COUNT(i.id) AS set_count,
         COALESCE(SUM(i.quantity), 0) AS total_quantity,
         COALESCE(SUM(i.quantity * COALESCE(i.purchase_price, 0)), 0) AS invested,
         COALESCE(
           SUM(
             i.quantity * COALESCE((
               SELECT ph.avg_price
               FROM price_history ph
               WHERE ph.set_num = i.set_num
               ORDER BY ph.date DESC, ph.id DESC
               LIMIT 1
             ), 0)
           ),
           0
         ) AS value
       FROM inventory i
       JOIN set_catalog sc ON sc.set_num = i.set_num
       GROUP BY theme_name
       ORDER BY value DESC, theme_name ASC`
    )
    .all() as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => ({
      themeName: String(row.theme_name),
      setCount: Number(row.set_count),
      totalQuantity: Number(row.total_quantity),
      invested: Number(row.invested),
      value: Number(row.value),
      gainLoss: Number(row.value) - Number(row.invested)
    }))
  });
});

reportsRoute.get("/reports/top-sets", (c) => {
  const limitQuery = Number(c.req.query("limit") ?? "10");
  const limit = Number.isInteger(limitQuery) && limitQuery > 0 ? limitQuery : 10;

  const db = getDb();
  const rows = db
    .query(
      `SELECT
         i.id,
         i.set_num,
         sc.name AS set_name,
         sc.theme_name,
         i.quantity,
         i.purchase_price,
         (
           SELECT ph.avg_price
           FROM price_history ph
           WHERE ph.set_num = i.set_num
           ORDER BY ph.date DESC, ph.id DESC
           LIMIT 1
         ) AS latest_price
       FROM inventory i
       JOIN set_catalog sc ON sc.set_num = i.set_num
       ORDER BY (i.quantity * COALESCE(latest_price, 0)) DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => {
      const latestPrice = row.latest_price === null ? null : Number(row.latest_price);
      const quantity = Number(row.quantity);
      const purchasePrice = row.purchase_price === null ? null : Number(row.purchase_price);
      const marketValue = latestPrice === null ? null : latestPrice * quantity;
      const investedValue = purchasePrice === null ? null : purchasePrice * quantity;
      return {
        id: Number(row.id),
        setNum: String(row.set_num),
        setName: String(row.set_name),
        themeName: row.theme_name === null ? null : String(row.theme_name),
        quantity,
        latestPrice,
        marketValue,
        gainLoss: marketValue !== null && investedValue !== null ? marketValue - investedValue : null
      };
    })
  });
});

reportsRoute.get("/reports/trends", (c) => {
  const daysQuery = Number(c.req.query("days") ?? "90");
  const days = Number.isInteger(daysQuery) && daysQuery > 0 ? daysQuery : 90;

  const db = getDb();
  const rows = db
    .query(
      `SELECT
         ph.date,
         COALESCE(SUM(i.quantity * COALESCE(ph.avg_price, 0)), 0) AS total_value
       FROM inventory i
       JOIN price_history ph ON ph.set_num = i.set_num
       WHERE ph.date >= date('now', ?)
         AND ph.id = (
           SELECT ph2.id
           FROM price_history ph2
           WHERE ph2.set_num = ph.set_num
             AND ph2.date = ph.date
           ORDER BY ph2.id DESC
           LIMIT 1
         )
       GROUP BY ph.date
       ORDER BY ph.date ASC`
    )
    .all(`-${days} day`) as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => ({
      date: String(row.date),
      totalValue: Number(row.total_value)
    }))
  });
});

reportsRoute.get("/reports/movers", (c) => {
  const daysQuery = Number(c.req.query("days") ?? "30");
  const limitQuery = Number(c.req.query("limit") ?? "10");
  const days = Number.isInteger(daysQuery) && daysQuery > 0 ? daysQuery : 30;
  const limit = Number.isInteger(limitQuery) && limitQuery > 0 ? limitQuery : 10;

  const db = getDb();
  const rows = db
    .query(
      `WITH quantities AS (
          SELECT set_num, SUM(quantity) AS quantity
          FROM inventory
          GROUP BY set_num
        ),
        latest AS (
          SELECT
            set_num,
            avg_price,
            ROW_NUMBER() OVER (PARTITION BY set_num ORDER BY date DESC, id DESC) AS rn
          FROM price_history
          WHERE date >= date('now', ?)
        ),
        earliest AS (
          SELECT
            set_num,
            avg_price,
            ROW_NUMBER() OVER (PARTITION BY set_num ORDER BY date ASC, id ASC) AS rn
          FROM price_history
          WHERE date >= date('now', ?)
        )
        SELECT
          q.set_num,
          sc.name AS set_name,
          q.quantity,
          l.avg_price AS latest_price,
          e.avg_price AS earliest_price,
          (COALESCE(l.avg_price, 0) - COALESCE(e.avg_price, 0)) * q.quantity AS change_value
        FROM quantities q
        JOIN set_catalog sc ON sc.set_num = q.set_num
        LEFT JOIN latest l ON l.set_num = q.set_num AND l.rn = 1
        LEFT JOIN earliest e ON e.set_num = q.set_num AND e.rn = 1
        WHERE l.avg_price IS NOT NULL AND e.avg_price IS NOT NULL
        ORDER BY ABS(change_value) DESC
        LIMIT ?`
    )
    .all(`-${days} day`, `-${days} day`, limit) as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => {
      const latestPrice = Number(row.latest_price);
      const earliestPrice = Number(row.earliest_price);
      const pctChange = earliestPrice !== 0 ? ((latestPrice - earliestPrice) / earliestPrice) * 100 : null;
      return {
        setNum: String(row.set_num),
        setName: String(row.set_name),
        quantity: Number(row.quantity),
        latestPrice,
        earliestPrice,
        changeValue: Number(row.change_value),
        pctChange
      };
    })
  });
});

reportsRoute.get("/reports/recent", (c) => {
  const limitQuery = Number(c.req.query("limit") ?? "10");
  const limit = Number.isInteger(limitQuery) && limitQuery > 0 ? limitQuery : 10;

  const db = getDb();
  const rows = db
    .query(
      `SELECT
         i.id,
         i.set_num,
         sc.name AS set_name,
         sc.set_img_url,
         i.quantity,
         i.created_at
       FROM inventory i
       JOIN set_catalog sc ON sc.set_num = i.set_num
       ORDER BY i.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return c.json({
    items: rows.map((row) => ({
      id: Number(row.id),
      setNum: String(row.set_num),
      setName: String(row.set_name),
      setImgUrl: row.set_img_url === null ? null : String(row.set_img_url),
      quantity: Number(row.quantity),
      createdAt: String(row.created_at)
    }))
  });
});
