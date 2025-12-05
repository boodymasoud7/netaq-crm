import { useQuery } from '@tanstack/react-query';
import { dbAPI } from '../lib/apiSwitch';

/**
 * Dashboard Queries
 * Optimized queries with caching for Dashboard page
 */

// Get Dashboard Summary with Trends
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await dbAPI.get('/dashboard/summary');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
};

// Get Last 7 Days Stats for Charts
export const useLast7DaysStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'last-7-days'],
    queryFn: async () => {
      const response = await dbAPI.get('/dashboard/last-7-days');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });
};

// Get Manager Dashboard (existing)
export const useManagerDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: async () => {
      const response = await dbAPI.get('/dashboard/manager');
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });
};
