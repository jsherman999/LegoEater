export type PriceHistoryRecord = {
  id: number;
  setNum: string;
  date: string;
  source: "bricklink" | "brickeconomy";
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  totalQuantity: number | null;
  fetchedAt: string;
};
