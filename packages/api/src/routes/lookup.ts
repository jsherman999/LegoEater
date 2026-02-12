import { Hono } from "hono";
import Tesseract from "tesseract.js";
import { getSet, searchSets } from "../services/rebrickable";
import { lookupSetByBarcode } from "../services/upc-lookup";

const setNumRegex = /\b(\d{4,6}(?:-\d)?)\b/g;

export const lookupRoute = new Hono();

lookupRoute.get("/lookup/set/:setNum", async (c) => {
  try {
    const result = await getSet(c.req.param("setNum"));
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return c.json({ error: message }, 400);
  }
});

lookupRoute.get("/lookup/search", async (c) => {
  try {
    const query = c.req.query("q") ?? "";
    const items = await searchSets(query);
    return c.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return c.json({ error: message }, 400);
  }
});

lookupRoute.get("/lookup/barcode/:code", async (c) => {
  try {
    const result = await lookupSetByBarcode(c.req.param("code"));
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Barcode lookup failed";
    return c.json({ error: message }, 400);
  }
});

lookupRoute.post("/lookup/ocr", async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const file = body.image;

    if (!(file instanceof File)) {
      return c.json({ error: "image file is required" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await Tesseract.recognize(buffer, "eng");
    const text = result.data.text;

    const matches = Array.from(text.matchAll(setNumRegex)).map((match) => match[1]);
    if (matches.length === 0) {
      return c.json({ error: "No set number found in image", text }, 404);
    }

    const selected = matches[0];
    const setResult = await getSet(selected);

    return c.json({
      text,
      candidates: Array.from(new Set(matches)),
      selected,
      ...setResult
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR lookup failed";
    return c.json({ error: message }, 400);
  }
});
