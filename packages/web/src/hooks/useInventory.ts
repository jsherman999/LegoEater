import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

export type InventoryCondition = "new_sealed" | "opened_complete" | "opened_incomplete";

export type InventoryItem = {
  id: number;
  setNum: string;
  setName: string;
  year: number | null;
  themeName: string | null;
  setImgUrl: string | null;
  ownerId: number | null;
  ownerName: string | null;
  locationId: number | null;
  locationName: string | null;
  condition: InventoryCondition;
  quantity: number;
  purchasePrice: number | null;
  dateAcquired: string | null;
  notes: string | null;
  latestPrice: number | null;
  marketValue: number | null;
  gainLoss: number | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryListResponse = {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type InventoryFilters = {
  page?: number;
  pageSize?: number;
  owner?: string;
  location?: string;
  condition?: string;
  theme?: string;
  search?: string;
  sort?: string;
};

export type CreateInventoryPayload = {
  setNum: string;
  ownerId?: number | null;
  locationId?: number | null;
  condition: InventoryCondition;
  quantity?: number;
  purchasePrice?: number | null;
  dateAcquired?: string | null;
  notes?: string | null;
};

export type UpdateInventoryPayload = Omit<CreateInventoryPayload, "setNum">;

function toQueryString(filters: InventoryFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useInventoryList(filters: InventoryFilters) {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: () => apiClient.get<InventoryListResponse>(`/sets${toQueryString(filters)}`)
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => apiClient.get<InventoryItem>(`/sets/${id}`),
    enabled: id.length > 0
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventoryPayload) => apiClient.post<{ id: number }>("/sets", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });
}

export function useUpdateInventory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInventoryPayload) => apiClient.put<{ id: number }>(`/sets/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });
    }
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del<null>(`/sets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });
}
