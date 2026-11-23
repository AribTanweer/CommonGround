import { useQuery } from '@tanstack/react-query';
import { apiClient } from './axios';
import { LeaderboardUser, OverviewStats, PaginatedResponse } from './types';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async (): Promise<OverviewStats> => {
      const { data } = await apiClient.get<OverviewStats>('/stats/overview/');
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardUser[]> => {
      const { data } = await apiClient.get<LeaderboardUser[] | PaginatedResponse<LeaderboardUser>>('/leaderboard/');
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 1000 * 60 * 5,
  });
};
