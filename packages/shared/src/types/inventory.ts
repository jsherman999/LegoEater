export const inventoryConditions = [
  "new_sealed",
  "opened_complete",
  "opened_incomplete"
] as const;

export type InventoryCondition = (typeof inventoryConditions)[number];

export type InventoryRecord = {
  id: number;
  setNum: string;
  ownerId: number | null;
  locationId: number | null;
  condition: InventoryCondition;
  quantity: number;
  purchasePrice: number | null;
  dateAcquired: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryInput = {
  setNum: string;
  ownerId?: number | null;
  locationId?: number | null;
  condition: InventoryCondition;
  quantity?: number;
  purchasePrice?: number | null;
  dateAcquired?: string | null;
  notes?: string | null;
};
