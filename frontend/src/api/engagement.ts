import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { Comment, PaginatedResponse } from './types';

interface CommentParams {
  challengeId?: number | string;
  solutionId?: number | string;
}

export const useComments = ({ challengeId, solutionId }: CommentParams) => {
  const endpoint = challengeId
    ? `/challenges/${challengeId}/comments/`
    : solutionId
    ? `/solutions/${solutionId}/comments/`
    : null;

  return useQuery({
    queryKey: ['comments', { challengeId, solutionId }],
    queryFn: async (): Promise<Comment[]> => {
      if (!endpoint) return [];
      const { data } = await apiClient.get<Comment[] | PaginatedResponse<Comment>>(endpoint);
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!endpoint,
  });
};

export const useCreateComment = ({ challengeId, solutionId }: CommentParams) => {
  const queryClient = useQueryClient();
  const endpoint = challengeId
    ? `/challenges/${challengeId}/comments/`
    : solutionId
    ? `/solutions/${solutionId}/comments/`
    : '';

  return useMutation({
    mutationFn: async (payload: { body: string; parent?: number | null }) => {
      const { data } = await apiClient.post<Comment>(endpoint, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', { challengeId, solutionId }] });
    },
  });
};

export const useDeleteComment = ({ challengeId, solutionId }: CommentParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      await apiClient.delete(`/comments/${commentId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', { challengeId, solutionId }] });
    },
  });
};

export const useReport = () => {
  return useMutation({
    mutationFn: async (payload: {
      challenge?: number;
      solution?: number;
      comment?: number;
      reason: string;
    }) => {
      const { data } = await apiClient.post('/reports/', payload);
      return data;
    },
  });
};
