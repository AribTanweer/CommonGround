import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, setAccessToken } from './axios';
import { LoginResponse, User } from './types';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAccessToken(data.access);
      localStorage.setItem('refresh_token', data.refresh);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (payload: { username: string; email: string; password: string; bio?: string; location?: string }) => {
      const { data } = await apiClient.post('/auth/register/', payload);
      return data;
    },
  });
};

export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get<User>('/users/me/');
      return data;
    },
    enabled,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const { data } = await apiClient.patch<User>('/users/me/', payload);
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['currentUser'], updated);
      queryClient.invalidateQueries({ queryKey: ['user', updated.username] });
    },
  });
};

export const useUserProfile = (username: string | undefined) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get<User>(`/users/${username}/`);
      return data;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 2,
  });
};
