import { getDb } from "../db/database";

type RebrickableSetResponse = {
  set_num: string;
  name: string;
  year: number | null;
  theme_id: number | null;
  num_parts: number | null;
  set_img_url: string | null;
  last_modified_dt: string | null;
};

type RebrickableThemeResponse = {
  id: number;
  name: string;
};

const REBRICKABLE_BASE = "https://rebrickable.com/api/v3/lego";
const apiKey = process.env.REBRICKABLE_API_KEY;

function requireApiKey(): string {
  if (!apiKey) {
    throw new Error("REBRICKABLE_API_KEY is required");
  }
  return apiKey;
}

function normalizeSetNum(setNum: string): string {
  const trimmed = setNum.trim();
  if (!trimmed.includes("-")) {
    return `${trimmed}-1`;
  }
  return trimmed;
}

function mapCatalogRow(row: Record<string, unknown>) {
  return {
    setNum: String(row.set_num),
    name: String(row.name),
    year: row.year === null ? null : Number(row.year),
    themeName: row.theme_name === null ? null : String(row.theme_name),
    themeId: row.theme_id === null ? null : Number(row.theme_id),
    numParts: row.num_parts === null ? null : Number(row.num_parts),
    setImgUrl: row.set_img_url === null ? null : String(row.set_img_url),
    lastModifiedDt: row.last_modified_dt === null ? null : String(row.last_modified_dt),
    fetchedAt: String(row.fetched_at)
  };
}

async function fetchThemeName(themeId: number | null): Promise<string | null> {
  if (!themeId) {
    return null;
  }

  const key = requireApiKey();
  const response = await fetch(`${REBRICKABLE_BASE}/themes/${themeId}/`, {
    headers: { Authorization: `key ${key}` }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as RebrickableThemeResponse;
  return payload.name ?? null;
}

function upsertSetCatalog(set: RebrickableSetResponse, themeName: string | null): void {
  const db = getDb();
  db.query(
    `INSERT INTO set_catalog (
      set_num, name, year, theme_name, theme_id, num_parts, set_img_url, last_modified_dt, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(set_num) DO UPDATE SET
      name = excluded.name,
      year = excluded.year,
      theme_name = excluded.theme_name,
      theme_id = excluded.theme_id,
      num_parts = excluded.num_parts,
      set_img_url = excluded.set_img_url,
      last_modified_dt = excluded.last_modified_dt,
      fetched_at = datetime('now')`
  ).run(
    set.set_num,
    set.name,
    set.year,
    themeName,
    set.theme_id,
    set.num_parts,
    set.set_img_url,
    set.last_modified_dt
  );
}

function getCachedSet(setNum: string): Record<string, unknown> | null {
  const db = getDb();
  return (
    db
      .query(
        `SELECT set_num, name, year, theme_name, theme_id, num_parts, set_img_url, last_modified_dt, fetched_at
         FROM set_catalog
         WHERE set_num = ?`
      )
      .get(setNum) ?? null
  ) as Record<string, unknown> | null;
}

export async function getSet(setNumInput: string): Promise<{ set: ReturnType<typeof mapCatalogRow>; source: "cache" | "rebrickable" }> {
  const attempted = [setNumInput.trim(), normalizeSetNum(setNumInput.trim())];

  for (const setNum of attempted) {
    const cached = getCachedSet(setNum);
    if (cached) {
      return { set: mapCatalogRow(cached), source: "cache" };
    }
  }

  const key = requireApiKey();

  for (const setNum of attempted) {
    const response = await fetch(`${REBRICKABLE_BASE}/sets/${setNum}/`, {
      headers: { Authorization: `key ${key}` }
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`Rebrickable request failed (${response.status})`);
    }

    const payload = (await response.json()) as RebrickableSetResponse;
    const themeName = await fetchThemeName(payload.theme_id);
    upsertSetCatalog(payload, themeName);

    const cached = getCachedSet(payload.set_num);
    if (!cached) {
      throw new Error("Failed to cache set metadata");
    }

    return {
      set: mapCatalogRow(cached),
      source: "rebrickable"
    };
  }

  throw new Error(`Set not found: ${setNumInput}`);
}

export async function searchSets(query: string): Promise<Array<{ setNum: string; name: string; year: number | null; setImgUrl: string | null }>> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const key = requireApiKey();
  const response = await fetch(
    `${REBRICKABLE_BASE}/sets/?search=${encodeURIComponent(q)}&page_size=20&ordering=-year`,
    {
      headers: { Authorization: `key ${key}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Rebrickable search failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    results: RebrickableSetResponse[];
  };

  return payload.results.map((item) => ({
    setNum: item.set_num,
    name: item.name,
    year: item.year,
    setImgUrl: item.set_img_url
  }));
}
