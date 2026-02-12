import { Hono } from "hono";
import { getDb } from "../db/database";
import { optionalString, requireNonEmptyString } from "@lego/shared";

type MemberRow = {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

export const membersRoute = new Hono();

membersRoute.get("/members", (c) => {
  const db = getDb();
  const items = db
    .query("SELECT id, name, avatar_url, created_at FROM family_members ORDER BY name")
    .all() as MemberRow[];

  return c.json({
    items: items.map((row) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at
    }))
  });
});

membersRoute.post("/members", async (c) => {
  try {
    const body = await c.req.json();
    const name = requireNonEmptyString(body.name, "name");
    const avatarUrl = optionalString(body.avatarUrl);

    const db = getDb();
    const insert = db.query("INSERT INTO family_members (name, avatar_url) VALUES (?, ?) RETURNING id, name, avatar_url, created_at");
    const row = insert.get(name, avatarUrl) as MemberRow;

    return c.json(
      {
        id: row.id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return c.json({ error: message }, 400);
  }
});

membersRoute.put("/members/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid member id" }, 400);
  }

  try {
    const body = await c.req.json();
    const name = requireNonEmptyString(body.name, "name");
    const avatarUrl = optionalString(body.avatarUrl);

    const db = getDb();
    db.query("UPDATE family_members SET name = ?, avatar_url = ? WHERE id = ?").run(name, avatarUrl, id);
    const row = db
      .query("SELECT id, name, avatar_url, created_at FROM family_members WHERE id = ?")
      .get(id) as MemberRow | null;

    if (!row) {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return c.json({ error: message }, 400);
  }
});

membersRoute.delete("/members/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid member id" }, 400);
  }

  const db = getDb();
  const result = db.query("DELETE FROM family_members WHERE id = ?").run(id);
  if ((result.changes ?? 0) === 0) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.body(null, 204);
});
