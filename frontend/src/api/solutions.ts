import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { PaginatedResponse, Solution, SolutionCreatePayload, SolutionRevision } from './types';

export const useSolutions = (challengeId: number | string | undefined) => {
  return useQuery({
    queryKey: ['solutions', challengeId],
    queryFn: async (): Promise<Solution[]> => {
      const { data } = await apiClient.get<Solution[] | PaginatedResponse<Solution>>(`/challenges/${challengeId}/solutions/`);
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!challengeId,
  });
};

export const useCreateSolution = (challengeId: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SolutionCreatePayload): Promise<Solution> => {
      const { data } = await apiClient.post<Solution>(`/challenges/${challengeId}/solutions/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useVoteSolution = (solutionId: number, challengeId?: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: 1 | -1) => {
      const { data } = await apiClient.post(`/solutions/${solutionId}/vote/`, { value });
      return data;
    },
    // Optimistic Update
    onMutate: async (voteValue: 1 | -1) => {
      if (challengeId) {
        await queryClient.cancelQueries({ queryKey: ['solutions', challengeId] });
        const prevSolutions = queryClient.getQueryData<Solution[]>(['solutions', challengeId]);

        if (prevSolutions) {
          queryClient.setQueryData<Solution[]>(
            ['solutions', challengeId],
            prevSolutions.map((sol) => {
              if (sol.id === solutionId) {
                const currentVote = sol.user_vote || 0;
                let scoreDelta = 0;
                let newVote: number = voteValue;

                if (currentVote === voteValue) {
                  // Toggle off
                  scoreDelta = -voteValue;
                  newVote = 0;
                } else if (currentVote !== 0) {
                  // Flipping from 1 to -1 or vice versa
                  scoreDelta = voteValue * 2;
                } else {
                  // New vote
                  scoreDelta = voteValue;
                }

                return {
                  ...sol,
                  score: sol.score + scoreDelta,
                  user_vote: newVote,
                };
              }
              return sol;
            })
          );
        }

        return { prevSolutions };
      }
    },
    onError: (_err, _vars, context) => {
      if (challengeId && context?.prevSolutions) {
        queryClient.setQueryData(['solutions', challengeId], context.prevSolutions);
      }
    },
    onSettled: () => {
      if (challengeId) {
        queryClient.invalidateQueries({ queryKey: ['solutions', challengeId] });
      }
    },
  });
};

export const useAcceptSolution = (solutionId: number, challengeId: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/solutions/${solutionId}/accept/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useSolutionRevisions = (solutionId: number | undefined) => {
  return useQuery({
    queryKey: ['solution-revisions', solutionId],
    queryFn: async (): Promise<SolutionRevision[]> => {
      const { data } = await apiClient.get<SolutionRevision[] | PaginatedResponse<SolutionRevision>>(
        `/solutions/${solutionId}/revisions/`
      );
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!solutionId,
  });
};
