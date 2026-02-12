import { Hono } from "hono";
import { getDb } from "../db/database";
import { optionalString, requireNonEmptyString } from "@lego/shared";

type LocationRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export const locationsRoute = new Hono();

locationsRoute.get("/locations", (c) => {
  const db = getDb();
  const items = db
    .query("SELECT id, name, description, created_at FROM locations ORDER BY name")
    .all() as LocationRow[];

  return c.json({
    items: items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    }))
  });
});

locationsRoute.post("/locations", async (c) => {
  try {
    const body = await c.req.json();
    const name = requireNonEmptyString(body.name, "name");
    const description = optionalString(body.description);

    const db = getDb();
    const row = db
      .query("INSERT INTO locations (name, description) VALUES (?, ?) RETURNING id, name, description, created_at")
      .get(name, description) as LocationRow;

    return c.json(
      {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return c.json({ error: message }, 400);
  }
});

locationsRoute.put("/locations/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid location id" }, 400);
  }

  try {
    const body = await c.req.json();
    const name = requireNonEmptyString(body.name, "name");
    const description = optionalString(body.description);

    const db = getDb();
    db.query("UPDATE locations SET name = ?, description = ? WHERE id = ?").run(name, description, id);
    const row = db
      .query("SELECT id, name, description, created_at FROM locations WHERE id = ?")
      .get(id) as LocationRow | null;

    if (!row) {
      return c.json({ error: "Location not found" }, 404);
    }

    return c.json({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return c.json({ error: message }, 400);
  }
});

locationsRoute.delete("/locations/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid location id" }, 400);
  }

  const db = getDb();
  const result = db.query("DELETE FROM locations WHERE id = ?").run(id);
  if ((result.changes ?? 0) === 0) {
    return c.json({ error: "Location not found" }, 404);
  }

  return c.body(null, 204);
});
