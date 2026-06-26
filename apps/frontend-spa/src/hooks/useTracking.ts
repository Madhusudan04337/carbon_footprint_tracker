import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('storage'));
    }
    throw new Error('Unauthorized');
  }

  return res;
}

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
      const res = await apiFetch('/logs?limit=10000');
      if (!res.ok) throw new Error('Failed to retrieve logs');
      return res.json();
    }
  });
}

export function useAddLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLog: Omit<ActivityLog, 'id' | 'emissions_co2e'>) => {
      const res = await apiFetch('/logs', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      if (!res.ok) throw new Error('Failed to log carbon activity');
      return res.json();
    },
    onSuccess: () => {
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
      const res = await apiFetch('/goals');
      if (!res.ok) throw new Error('Failed to retrieve goals');
      return res.json();
    }
  });
}

export function useToggleGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, completed }: { goalId: number; completed: boolean }) => {
      const res = await apiFetch(`/goals/${goalId}`, {
        method: 'PUT',
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
      const res = await apiFetch('/analytics/summary');
      if (!res.ok) throw new Error('Failed to retrieve summary analytics');
      return res.json();
    }
  });
}

export function useRecommendations() {
  return useQuery<any>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await apiFetch('/recommendations');
      if (!res.ok) throw new Error('Failed to retrieve recommendations');
      return res.json();
    }
  });
}
