import { getDb } from "../db/database";
import { getSet } from "./rebrickable";

const UPC_ITEM_DB_BASE = "https://api.upcitemdb.com/prod/trial/lookup";
const setNumPattern = /\b(\d{4,6}(?:-\d)?)\b/;

function getCachedBarcode(barcode: string): string | null {
  const db = getDb();
  const row = db.query("SELECT set_num FROM barcode_map WHERE barcode = ?").get(barcode) as
    | { set_num: string }
    | null;
  return row?.set_num ?? null;
}

function cacheBarcode(barcode: string, setNum: string, source = "upcitemdb"): void {
  const db = getDb();
  db.query(
    `INSERT INTO barcode_map (barcode, set_num, source, fetched_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(barcode) DO UPDATE SET
      set_num = excluded.set_num,
      source = excluded.source,
      fetched_at = datetime('now')`
  ).run(barcode, setNum, source);
}

async function fetchSetNumFromUpcItemDb(barcode: string): Promise<string | null> {
  const response = await fetch(`${UPC_ITEM_DB_BASE}?upc=${encodeURIComponent(barcode)}`);
  if (!response.ok) {
    throw new Error(`UPCitemdb request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    items?: Array<{ title?: string }>;
  };

  for (const item of payload.items ?? []) {
    const title = item.title ?? "";
    const match = title.match(setNumPattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export async function lookupSetByBarcode(barcode: string) {
  const code = barcode.trim();
  if (!code) {
    throw new Error("barcode is required");
  }

  const cachedSet = getCachedBarcode(code);
  if (cachedSet) {
    const result = await getSet(cachedSet);
    return { ...result, barcodeSource: "cache" as const };
  }

  const setNum = await fetchSetNumFromUpcItemDb(code);
  if (!setNum) {
    throw new Error(`No LEGO set detected for barcode ${code}`);
  }

  const result = await getSet(setNum);
  cacheBarcode(code, result.set.setNum);
  return { ...result, barcodeSource: "upcitemdb" as const };
}
