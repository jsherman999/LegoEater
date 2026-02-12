import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";

const FIVE_MIN = 5 * 60 * 1000;

export type SummaryReport = {
  totalSets: number;
  totalQuantity: number;
  totalInvested: number;
  totalValue: number;
  gainLoss: number;
  roi: number;
};

export type MemberReportItem = {
  memberId: number;
  memberName: string;
  setCount: number;
  totalQuantity: number;
  invested: number;
  value: number;
  gainLoss: number;
};

export type ThemeReportItem = {
  themeName: string;
  setCount: number;
  totalQuantity: number;
  invested: number;
  value: number;
  gainLoss: number;
};

export type TopSetItem = {
  id: number;
  setNum: string;
  setName: string;
  themeName: string | null;
  quantity: number;
  latestPrice: number | null;
  marketValue: number | null;
  gainLoss: number | null;
};

export type TrendPoint = {
  date: string;
  totalValue: number;
};

export type MoverItem = {
  setNum: string;
  setName: string;
  quantity: number;
  latestPrice: number;
  earliestPrice: number;
  changeValue: number;
  pctChange: number | null;
};

export type RecentItem = {
  id: number;
  setNum: string;
  setName: string;
  setImgUrl: string | null;
  quantity: number;
  createdAt: string;
};

export function useSummaryReport() {
  return useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => apiClient.get<SummaryReport>("/reports/summary"),
    staleTime: FIVE_MIN
  });
}

export function useByMemberReport() {
  return useQuery({
    queryKey: ["reports", "by-member"],
    queryFn: () => apiClient.get<{ items: MemberReportItem[] }>("/reports/by-member"),
    staleTime: FIVE_MIN
  });
}

export function useByThemeReport() {
  return useQuery({
    queryKey: ["reports", "by-theme"],
    queryFn: () => apiClient.get<{ items: ThemeReportItem[] }>("/reports/by-theme"),
    staleTime: FIVE_MIN
  });
}

export function useTopSetsReport(limit = 10) {
  return useQuery({
    queryKey: ["reports", "top-sets", limit],
    queryFn: () => apiClient.get<{ items: TopSetItem[] }>(`/reports/top-sets?limit=${limit}`),
    staleTime: FIVE_MIN
  });
}

export function useTrendReport(days = 90) {
  return useQuery({
    queryKey: ["reports", "trends", days],
    queryFn: () => apiClient.get<{ items: TrendPoint[] }>(`/reports/trends?days=${days}`),
    staleTime: FIVE_MIN
  });
}

export function useMoversReport(days = 30, limit = 10) {
  return useQuery({
    queryKey: ["reports", "movers", days, limit],
    queryFn: () => apiClient.get<{ items: MoverItem[] }>(`/reports/movers?days=${days}&limit=${limit}`),
    staleTime: FIVE_MIN
  });
}

export function useRecentReport(limit = 10) {
  return useQuery({
    queryKey: ["reports", "recent", limit],
    queryFn: () => apiClient.get<{ items: RecentItem[] }>(`/reports/recent?limit=${limit}`),
    staleTime: FIVE_MIN
  });
}
