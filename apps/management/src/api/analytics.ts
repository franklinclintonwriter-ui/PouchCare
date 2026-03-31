import { useQuery } from '@tanstack/react-query';
import api from './client';
import type {
  HealthScore,
  RevenueData,
  StaffStats,
  ClientStats,
  Leaderboard,
  ForecastData,
} from '@/types/analytics';

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

export function useForecast() {
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: async () => {
      const res = await api.get<ForecastData>('/analytics/forecast');
      return res.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
