import { useQuery } from '@tanstack/react-query';
import api from './client';
import type {
  HealthScore,
  RevenueData,
  StaffStats,
  ClientStats,
  Leaderboard,
  ForecastData,
  TaskStats,
  ActivitiesData,
  DashboardSummary,
} from '@/types/analytics';

// ── Dashboard Summary (Consolidated - Single Request) ───────────────────────

export function useDashboardSummary(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await api.get<DashboardSummary>('/analytics/summary');
      return res.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
}

// ── Individual Endpoints (for granular fetching) ────────────────────────────

export function useHealthScore() {
  return useQuery({
    queryKey: ['analytics', 'health'],
    queryFn: async () => {
      const res = await api.get<HealthScore>('/analytics/health');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useRevenueAnalytics(year?: number) {
  return useQuery({
    queryKey: ['analytics', 'revenue', year],
    queryFn: async () => {
      const params = year ? { year } : {};
      const res = await api.get<RevenueData>('/analytics/revenue', { params });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaffStats() {
  return useQuery({
    queryKey: ['analytics', 'staff'],
    queryFn: async () => {
      const res = await api.get<StaffStats>('/analytics/staff');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: ['analytics', 'clients'],
    queryFn: async () => {
      const res = await api.get<ClientStats>('/analytics/clients');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: async () => {
      const res = await api.get<Leaderboard>('/analytics/leaderboard');
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useForecast(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: async () => {
      const res = await api.get<ForecastData>('/analytics/forecast');
      return res.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['analytics', 'tasks'],
    queryFn: async () => {
      const res = await api.get<TaskStats>('/analytics/tasks');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivities(limit?: number) {
  return useQuery({
    queryKey: ['analytics', 'activities', limit],
    queryFn: async () => {
      const params = limit ? { limit } : {};
      const res = await api.get<ActivitiesData>('/analytics/activities', { params });
      return res.data;
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}
