import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { Notification, PaginatedResponse } from './types';

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data } = await apiClient.get<Notification[] | PaginatedResponse<Notification>>('/notifications/');
      return Array.isArray(data) ? data : data.results;
    },
    enabled,
    refetchInterval: 30000, // 30-second polling interval as required
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { id?: number; ids?: number[] }) => {
      const { data } = await apiClient.post('/notifications/mark-read/', payload || {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
