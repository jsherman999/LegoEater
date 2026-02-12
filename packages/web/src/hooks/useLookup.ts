import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

export type LookupResult = {
  set: {
    setNum: string;
    name: string;
    year: number | null;
    themeName: string | null;
    numParts: number | null;
    setImgUrl: string | null;
  };
  source: "cache" | "rebrickable";
};

export function useSetLookup() {
  return useMutation({
    mutationFn: async (setNum: string) => apiClient.get<LookupResult>(`/lookup/set/${encodeURIComponent(setNum)}`)
  });
}

export function useBarcodeLookup() {
  return useMutation({
    mutationFn: async (barcode: string) =>
      apiClient.get<LookupResult & { barcodeSource: "cache" | "upcitemdb" }>(
        `/lookup/barcode/${encodeURIComponent(barcode)}`
      )
  });
}

export function useOcrLookup() {
  return useMutation({
    mutationFn: async (image: File) => {
      const payload = new FormData();
      payload.append("image", image);
      return apiClient.post<LookupResult & { text: string; candidates: string[]; selected: string }>(
        "/lookup/ocr",
        payload
      );
    }
  });
}

export function useSetSearch() {
  return useMutation({
    mutationFn: async (query: string) =>
      apiClient.get<{ items: Array<{ setNum: string; name: string; year: number | null; setImgUrl: string | null }> }>(
        `/lookup/search?q=${encodeURIComponent(query)}`
      )
  });
}
