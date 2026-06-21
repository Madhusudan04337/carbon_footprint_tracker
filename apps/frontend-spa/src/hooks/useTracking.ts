import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Authentication Header mock wrapper. In production, resolve from AuthContext
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface ActivityLog {
  id: number;
  category: 'transport' | 'diet' | 'energy' | 'waste';
  sub_category: string;
  value: number;
  emissions_co2e: number;
  date: string;
}

export interface CarbonGoal {
  id: number;
  title: string;
  category: string;
  target_reduction_percent: number;
  target_emissions_limit: number;
  start_date: string;
  end_date: string;
  completed: boolean;
}

export interface AnalyticsSummary {
  total_emissions_co2e: number;
  category_breakdown: {
    transport: number;
    diet: number;
    energy: number;
    waste?: number;
  };
  benchmarks: {
    user_total: number;
    national_monthly_average: number;
    percent_difference: number;
  };
  logs_count: number;
}

export function useLogs() {
  return useQuery<ActivityLog[]>({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/logs`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve logs');
      const data = await res.json();
      return data;
    }
  });
}

export function useAddLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLog: Omit<ActivityLog, 'id' | 'emissions_co2e'>) => {
      const res = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newLog)
      });
      if (!res.ok) throw new Error('Failed to log carbon activity');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh view
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    }
  });
}

export function useGoals() {
  return useQuery<CarbonGoal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve goals');
      return res.json();
    }
  });
}

export function useToggleGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, completed }: { goalId: number; completed: boolean }) => {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ completed })
      });
      if (!res.ok) throw new Error('Failed to toggle goal status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

export function useAnalytics() {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/analytics/summary`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve summary analytics');
      return res.json();
    }
  });
}

export function useRecommendations() {
  return useQuery<any>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/recommendations`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve recommendations');
      return res.json();
    }
  });
}
