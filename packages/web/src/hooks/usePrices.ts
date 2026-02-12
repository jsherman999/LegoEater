import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

export type PricePoint = {
  setNum: string;
  date: string;
  source: string;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  totalQuantity: number | null;
  fetchedAt: string;
};

export function useLatestPrice(setNum: string) {
  return useQuery({
    queryKey: ["prices", "latest", setNum],
    queryFn: () => apiClient.get<PricePoint>(`/prices/${encodeURIComponent(setNum)}`),
    enabled: setNum.length > 0
  });
}

export function usePriceHistory(setNum: string, days = 90) {
  return useQuery({
    queryKey: ["prices", "history", setNum, days],
    queryFn: () => apiClient.get<{ items: PricePoint[] }>(`/prices/${encodeURIComponent(setNum)}/history?days=${days}`),
    enabled: setNum.length > 0
  });
}

export function useTriggerPriceUpdate() {
  return useMutation({
    mutationFn: (setNum?: string) =>
      apiClient.post<{ updated: number; failed: number; failures: Array<{ setNum: string; error: string }> }>(
        "/prices/update",
        setNum ? { setNum } : {}
      )
  });
}
