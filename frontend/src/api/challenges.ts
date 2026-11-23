import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { Category, Challenge, PaginatedResponse, Tag } from './types';

export interface ChallengeQueryParams {
  category?: string;
  status?: string;
  tag?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const useChallenges = (params: ChallengeQueryParams = {}) => {
  return useQuery({
    queryKey: ['challenges', params],
    queryFn: async (): Promise<PaginatedResponse<Challenge>> => {
      const { data } = await apiClient.get<PaginatedResponse<Challenge>>('/challenges/', {
        params,
      });
      return data;
    },
    staleTime: 1000 * 60,
  });
};

export const useChallenge = (idOrSlug: string | number | undefined) => {
  return useQuery({
    queryKey: ['challenge', idOrSlug],
    queryFn: async (): Promise<Challenge> => {
      const { data } = await apiClient.get<Challenge>(`/challenges/${idOrSlug}/`);
      return data;
    },
    enabled: !!idOrSlug,
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData | Record<string, unknown>) => {
      const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
      const { data } = await apiClient.post<Challenge>('/challenges/', formData, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useUpdateChallengeStatus = (challengeId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await apiClient.patch<Challenge>(`/challenges/${challengeId}/status/`, { status });
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['challenge', challengeId], updated);
      queryClient.setQueryData(['challenge', updated.slug], updated);
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useSupportChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isSupported }: { isSupported: boolean }) => {
      if (isSupported) {
        // Remove support (DELETE)
        const { data } = await apiClient.delete(`/challenges/${challengeId}/support/`);
        return data;
      } else {
        // Add support (POST)
        const { data } = await apiClient.post(`/challenges/${challengeId}/support/`);
        return data;
      }
    },
    // Optimistic Update
    onMutate: async ({ isSupported }) => {
      await queryClient.cancelQueries({ queryKey: ['challenge', challengeId] });

      const prevDetail = queryClient.getQueryData<Challenge>(['challenge', challengeId]);
      if (prevDetail) {
        queryClient.setQueryData<Challenge>(['challenge', challengeId], {
          ...prevDetail,
          has_supported: !isSupported,
          support_count: Math.max(0, prevDetail.support_count + (isSupported ? -1 : 1)),
        });
      }

      return { prevDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevDetail) {
        queryClient.setQueryData(['challenge', challengeId], context.prevDetail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useFollowChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isFollowing }: { isFollowing: boolean }) => {
      if (isFollowing) {
        const { data } = await apiClient.delete(`/challenges/${challengeId}/follow/`);
        return data;
      } else {
        const { data } = await apiClient.post(`/challenges/${challengeId}/follow/`);
        return data;
      }
    },
    onMutate: async ({ isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ['challenge', challengeId] });
      const prev = queryClient.getQueryData<Challenge>(['challenge', challengeId]);
      if (prev) {
        queryClient.setQueryData<Challenge>(['challenge', challengeId], {
          ...prev,
          is_following: !isFollowing,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['challenge', challengeId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await apiClient.get<Category[] | PaginatedResponse<Category>>('/categories/');
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data } = await apiClient.get<Tag[] | PaginatedResponse<Tag>>('/tags/');
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 1000 * 60 * 30,
  });
};
