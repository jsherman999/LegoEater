import { Hono } from "hono";
import { getDb } from "../db/database";
import { getSet } from "../services/rebrickable";
import { isInventoryCondition, optionalString, positiveInt } from "@lego/shared";

const allowedSort: Record<string, string> = {
  name: "sc.name COLLATE NOCASE ASC",
  value: "latest_avg_price DESC",
  year: "sc.year DESC",
  date_added: "i.created_at DESC"
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export const setsRoute = new Hono();

setsRoute.get("/sets", (c) => {
  const db = getDb();
  const page = parsePositiveInt(c.req.query("page"), 1);
  const pageSize = parsePositiveInt(c.req.query("pageSize"), 20);
  const owner = c.req.query("owner");
  const location = c.req.query("location");
  const condition = c.req.query("condition");
  const theme = c.req.query("theme");
  const search = c.req.query("search");
  const sort = c.req.query("sort") ?? "date_added";

  const where: string[] = [];
  const params: Array<string | number> = [];

  if (owner) {
    where.push("i.owner_id = ?");
    params.push(Number(owner));
  }
  if (location) {
    where.push("i.location_id = ?");
    params.push(Number(location));
  }
  if (condition) {
    where.push("i.condition = ?");
    params.push(condition);
  }
  if (theme) {
    where.push("sc.theme_name = ?");
    params.push(theme);
  }
  if (search) {
    where.push("(sc.name LIKE ? OR i.set_num LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy = allowedSort[sort] ?? allowedSort.date_added;
  const offset = Math.max(page - 1, 0) * Math.max(pageSize, 1);

  const rows = db
    .query(
      `SELECT
        i.id,
        i.set_num,
        i.owner_id,
        i.location_id,
        i.condition,
        i.quantity,
        i.purchase_price,
        i.date_acquired,
        i.notes,
        i.created_at,
        i.updated_at,
        sc.name AS set_name,
        sc.year,
        sc.theme_name,
        sc.set_img_url,
        fm.name AS owner_name,
        l.name AS location_name,
        (
          SELECT ph.avg_price
          FROM price_history ph
          WHERE ph.set_num = i.set_num
          ORDER BY ph.date DESC, ph.id DESC
          LIMIT 1
        ) AS latest_avg_price
      FROM inventory i
      JOIN set_catalog sc ON sc.set_num = i.set_num
      LEFT JOIN family_members fm ON fm.id = i.owner_id
      LEFT JOIN locations l ON l.id = i.location_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Array<Record<string, unknown>>;

  const totalRow = db
    .query(
      `SELECT COUNT(*) AS total
       FROM inventory i
       JOIN set_catalog sc ON sc.set_num = i.set_num
       ${whereClause}`
    )
    .get(...params) as { total: number };

  return c.json({
    items: rows.map((row) => {
      const latestPrice = row.latest_avg_price === null ? null : Number(row.latest_avg_price);
      const quantity = Number(row.quantity);
      return {
        id: Number(row.id),
        setNum: String(row.set_num),
        setName: String(row.set_name),
        year: row.year === null ? null : Number(row.year),
        themeName: row.theme_name === null ? null : String(row.theme_name),
        setImgUrl: row.set_img_url === null ? null : String(row.set_img_url),
        ownerId: row.owner_id === null ? null : Number(row.owner_id),
        ownerName: row.owner_name === null ? null : String(row.owner_name),
        locationId: row.location_id === null ? null : Number(row.location_id),
        locationName: row.location_name === null ? null : String(row.location_name),
        condition: String(row.condition),
        quantity,
        purchasePrice: row.purchase_price === null ? null : Number(row.purchase_price),
        dateAcquired: row.date_acquired === null ? null : String(row.date_acquired),
        notes: row.notes === null ? null : String(row.notes),
        latestPrice,
        marketValue: latestPrice === null ? null : latestPrice * quantity,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at)
      };
    }),
    total: totalRow.total,
    page,
    pageSize
  });
});

setsRoute.get("/sets/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid set id" }, 400);
  }

  const db = getDb();
  const row = db
    .query(
      `SELECT
        i.id,
        i.set_num,
        i.owner_id,
        i.location_id,
        i.condition,
        i.quantity,
        i.purchase_price,
        i.date_acquired,
        i.notes,
        i.created_at,
        i.updated_at,
        sc.name AS set_name,
        sc.year,
        sc.theme_name,
        sc.num_parts,
        sc.set_img_url,
        fm.name AS owner_name,
        l.name AS location_name,
        (
          SELECT ph.avg_price
          FROM price_history ph
          WHERE ph.set_num = i.set_num
          ORDER BY ph.date DESC, ph.id DESC
          LIMIT 1
        ) AS latest_avg_price
      FROM inventory i
      JOIN set_catalog sc ON sc.set_num = i.set_num
      LEFT JOIN family_members fm ON fm.id = i.owner_id
      LEFT JOIN locations l ON l.id = i.location_id
      WHERE i.id = ?`
    )
    .get(id) as Record<string, unknown> | null;

  if (!row) {
    return c.json({ error: "Set not found" }, 404);
  }

  const latestPrice = row.latest_avg_price === null ? null : Number(row.latest_avg_price);
  const quantity = Number(row.quantity);

  return c.json({
    id: Number(row.id),
    setNum: String(row.set_num),
    setName: String(row.set_name),
    year: row.year === null ? null : Number(row.year),
    themeName: row.theme_name === null ? null : String(row.theme_name),
    numParts: row.num_parts === null ? null : Number(row.num_parts),
    setImgUrl: row.set_img_url === null ? null : String(row.set_img_url),
    ownerId: row.owner_id === null ? null : Number(row.owner_id),
    ownerName: row.owner_name === null ? null : String(row.owner_name),
    locationId: row.location_id === null ? null : Number(row.location_id),
    locationName: row.location_name === null ? null : String(row.location_name),
    condition: String(row.condition),
    quantity,
    purchasePrice: row.purchase_price === null ? null : Number(row.purchase_price),
    dateAcquired: row.date_acquired === null ? null : String(row.date_acquired),
    notes: row.notes === null ? null : String(row.notes),
    latestPrice,
    marketValue: latestPrice === null ? null : latestPrice * quantity,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  });
});

setsRoute.post("/sets", async (c) => {
  try {
    const body = await c.req.json();
    const setNum = String(body.setNum ?? "").trim();
    if (!setNum) {
      return c.json({ error: "setNum is required" }, 400);
    }

    await getSet(setNum);

    const condition = String(body.condition ?? "new_sealed");
    if (!isInventoryCondition(condition)) {
      return c.json({ error: "Invalid condition" }, 400);
    }

    const ownerId = body.ownerId === null || body.ownerId === undefined || body.ownerId === "" ? null : Number(body.ownerId);
    const locationId =
      body.locationId === null || body.locationId === undefined || body.locationId === "" ? null : Number(body.locationId);
    const quantity = positiveInt(body.quantity, 1);
    const purchasePrice = body.purchasePrice === null || body.purchasePrice === undefined || body.purchasePrice === ""
      ? null
      : Number(body.purchasePrice);
    const dateAcquired = optionalString(body.dateAcquired);
    const notes = optionalString(body.notes);

    const db = getDb();
    const row = db
      .query(
        `INSERT INTO inventory (
          set_num, owner_id, location_id, condition, quantity, purchase_price, date_acquired, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING id`
      )
      .get(setNum, ownerId, locationId, condition, quantity, purchasePrice, dateAcquired, notes) as { id: number };

    return c.json({ id: row.id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create set";
    return c.json({ error: message }, 400);
  }
});

setsRoute.put("/sets/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid set id" }, 400);
  }

  try {
    const body = await c.req.json();
    const condition = String(body.condition ?? "new_sealed");
    if (!isInventoryCondition(condition)) {
      return c.json({ error: "Invalid condition" }, 400);
    }

    const ownerId = body.ownerId === null || body.ownerId === undefined || body.ownerId === "" ? null : Number(body.ownerId);
    const locationId =
      body.locationId === null || body.locationId === undefined || body.locationId === "" ? null : Number(body.locationId);
    const quantity = positiveInt(body.quantity, 1);
    const purchasePrice = body.purchasePrice === null || body.purchasePrice === undefined || body.purchasePrice === ""
      ? null
      : Number(body.purchasePrice);
    const dateAcquired = optionalString(body.dateAcquired);
    const notes = optionalString(body.notes);

    const db = getDb();
    const result = db
      .query(
        `UPDATE inventory
         SET owner_id = ?, location_id = ?, condition = ?, quantity = ?, purchase_price = ?, date_acquired = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(ownerId, locationId, condition, quantity, purchasePrice, dateAcquired, notes, id);

    if ((result.changes ?? 0) === 0) {
      return c.json({ error: "Set not found" }, 404);
    }

    return c.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update set";
    return c.json({ error: message }, 400);
  }
});

setsRoute.delete("/sets/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid set id" }, 400);
  }

  const db = getDb();
  const result = db.query("DELETE FROM inventory WHERE id = ?").run(id);
  if ((result.changes ?? 0) === 0) {
    return c.json({ error: "Set not found" }, 404);
  }

  return c.body(null, 204);
});
