import { inventoryConditions, type InventoryCondition } from "./types/inventory";

export function isInventoryCondition(value: string): value is InventoryCondition {
  return (inventoryConditions as readonly string[]).includes(value);
}

export function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error("Expected a string");
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function positiveInt(value: unknown, fallback = 1): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Expected a positive integer");
  }
  return parsed;
}
