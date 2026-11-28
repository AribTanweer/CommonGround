import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { Category, Challenge, ChallengeUpdate, PaginatedResponse, Tag } from './types';

export interface ChallengeQueryParams {
  category?: string;
  author?: string;
  status?: string;
  tag?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const useChallenges = (params: ChallengeQueryParams = {}, enabled = true) => {
  return useQuery({
    queryKey: ['challenges', params],
    queryFn: async (): Promise<PaginatedResponse<Challenge>> => {
      const { data } = await apiClient.get<PaginatedResponse<Challenge>>('/challenges/', {
        params,
      });
      return data;
    },
    enabled,
    staleTime: 1000 * 60,
  });
};

export const useChallenge = (idOrSlug: string | number | undefined) => {
  const key = idOrSlug !== undefined ? String(idOrSlug) : undefined;
  return useQuery({
    queryKey: ['challenge', key],
    queryFn: async (): Promise<Challenge> => {
      const { data } = await apiClient.get<Challenge>(`/challenges/${idOrSlug}/`);
      return data;
    },
    enabled: !!idOrSlug,
  });
};

export const useChallengeUpdates = (challengeId: number | undefined) => useQuery({
  queryKey: ['challengeUpdates', challengeId],
  queryFn: async (): Promise<ChallengeUpdate[]> => {
    const { data } = await apiClient.get<ChallengeUpdate[]>(`/challenges/${challengeId}/updates/`);
    return data;
  },
  enabled: !!challengeId,
});

export const useCreateChallengeUpdate = (challengeId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string; evidence_url?: string }) => {
      const { data } = await apiClient.post<ChallengeUpdate>(`/challenges/${challengeId}/updates/`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challengeUpdates', challengeId] }),
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

export const useUpdateChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title?: string;
      description?: string;
      location?: string;
    }) => {
      const { data } = await apiClient.patch<Challenge>(`/challenges/${challengeId}/`, payload);
      return data;
    },
    onSuccess: (updated) => {
      if (updated?.id) {
        queryClient.setQueryData(['challenge', String(updated.id)], updated);
        if (updated.slug) {
          queryClient.setQueryData(['challenge', updated.slug], updated);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useDeleteChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/challenges/${challengeId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useUpdateChallengeStatus = (challengeId: number) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);
  return useMutation({
    mutationFn: async (payload: { status: string; note?: string; evidence_url?: string }) => {
      const { data } = await apiClient.patch<Challenge>(`/challenges/${challengeId}/status/`, payload);
      return data;
    },
    onSuccess: (updated) => {
      if (updated?.id) {
        queryClient.setQueryData(['challenge', key], updated);
        if (updated.slug) {
          queryClient.setQueryData(['challenge', updated.slug], updated);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['challengeUpdates', challengeId] });
    },
  });
};

export const useSupportChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);

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
      await queryClient.cancelQueries({ queryKey: ['challenge', key] });

      const prevDetail = queryClient.getQueryData<Challenge>(['challenge', key]);
      if (prevDetail) {
        queryClient.setQueryData<Challenge>(['challenge', key], {
          ...prevDetail,
          has_supported: !isSupported,
          support_count: Math.max(0, prevDetail.support_count + (isSupported ? -1 : 1)),
        });
      }

      return { prevDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevDetail) {
        queryClient.setQueryData(['challenge', key], context.prevDetail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useFollowChallenge = (challengeId: number) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);

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
      await queryClient.cancelQueries({ queryKey: ['challenge', key] });
      const prev = queryClient.getQueryData<Challenge>(['challenge', key]);
      if (prev) {
        queryClient.setQueryData<Challenge>(['challenge', key], {
          ...prev,
          is_following: !isFollowing,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['challenge', key], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
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
