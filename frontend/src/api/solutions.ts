import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios';
import { PaginatedResponse, ResourceOffer, Solution, SolutionCreatePayload, SolutionMilestone, SolutionQuestion, SolutionRevision, VolunteerSignup } from './types';

const useSolutionList = <T,>(solutionId: number, resource: string) => useQuery({
  queryKey: ['solution-coordination', solutionId, resource],
  queryFn: async (): Promise<T[]> => (await apiClient.get<T[]>(`/solutions/${solutionId}/${resource}/`)).data,
  enabled: !!solutionId,
});
const useSolutionCreate = <T, P>(solutionId: number, resource: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: P): Promise<T> => (await apiClient.post<T>(`/solutions/${solutionId}/${resource}/`, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['solution-coordination', solutionId, resource] }),
  });
};

export const useSolutionMilestones = (id: number) => useSolutionList<SolutionMilestone>(id, 'milestones');
export const useCreateMilestone = (id: number) => useSolutionCreate<SolutionMilestone, { title: string; due_date?: string }>(id, 'milestones');
export const useUpdateMilestone = (id: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId, ...payload }: { milestoneId: number; is_complete?: boolean; title?: string; due_date?: string | null }) =>
      (await apiClient.patch<SolutionMilestone>(`/milestones/${milestoneId}/`, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['solution-coordination', id, 'milestones'] }),
  });
};
export const useVolunteerSignups = (id: number) => useSolutionList<VolunteerSignup>(id, 'volunteers');
export const useSignUpToVolunteer = (id: number) => useSolutionCreate<VolunteerSignup, { contribution: string; note?: string }>(id, 'volunteers');
export const useResourceOffers = (id: number) => useSolutionList<ResourceOffer>(id, 'resources');
export const useOfferResource = (id: number) => useSolutionCreate<ResourceOffer, { resource: string; details?: string }>(id, 'resources');
const useWithdrawParticipation = (solutionId: number, type: 'volunteers' | 'resources') => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: number) => apiClient.delete(`/${type}/${recordId}/`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['solution-coordination', solutionId, type] }),
  });
};
export const useWithdrawVolunteer = (id: number) => useWithdrawParticipation(id, 'volunteers');
export const useRetractResource = (id: number) => useWithdrawParticipation(id, 'resources');
export const useSolutionQuestions = (id: number) => useSolutionList<SolutionQuestion>(id, 'questions');
export const useAskSolutionQuestion = (id: number) => useSolutionCreate<SolutionQuestion, { question: string }>(id, 'questions');
export const useAnswerSolutionQuestion = (solutionId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) =>
      (await apiClient.patch<SolutionQuestion>(`/questions/${questionId}/answer/`, { answer })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['solution-coordination', solutionId, 'questions'] }),
  });
};
export const useUpdateSolutionProgress = (solutionId: number, challengeId: number | string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { responsible_party?: string; target_date?: string | null }) =>
      (await apiClient.patch<Solution>(`/solutions/${solutionId}/progress/`, payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['solutions', String(challengeId)] });
      client.invalidateQueries({ queryKey: ['solution', solutionId] });
    },
  });
};
export const useUpdateSolutionOutcome = (solutionId: number, challengeId: number | string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { outcome_notes: string; actual_cost?: string; duration_days?: number | null; outcome_evidence_url?: string }) =>
      (await apiClient.patch<Solution>(`/solutions/${solutionId}/outcome/`, payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['solutions', String(challengeId)] });
      client.invalidateQueries({ queryKey: ['challenge'] });
    },
  });
};

export const useSolutions = (challengeId: number | string | undefined) => {
  const key = challengeId !== undefined ? String(challengeId) : undefined;
  return useQuery({
    queryKey: ['solutions', key],
    queryFn: async (): Promise<Solution[]> => {
      const { data } = await apiClient.get<Solution[] | PaginatedResponse<Solution>>(`/challenges/${challengeId}/solutions/`);
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!challengeId,
  });
};

export const useCreateSolution = (challengeId: number | string) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);
  return useMutation({
    mutationFn: async (payload: SolutionCreatePayload): Promise<Solution> => {
      const { data } = await apiClient.post<Solution>(`/challenges/${challengeId}/solutions/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', key] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useVoteSolution = (solutionId: number, challengeId?: number | string) => {
  const queryClient = useQueryClient();
  const key = challengeId !== undefined ? String(challengeId) : undefined;

  return useMutation({
    mutationFn: async (value: 1 | -1) => {
      const { data } = await apiClient.post(`/solutions/${solutionId}/vote/`, { value });
      return data;
    },
    // Optimistic Update
    onMutate: async (voteValue: 1 | -1) => {
      if (key) {
        await queryClient.cancelQueries({ queryKey: ['solutions', key] });
        const prevSolutions = queryClient.getQueryData<Solution[]>(['solutions', key]);

        if (prevSolutions) {
          queryClient.setQueryData<Solution[]>(
            ['solutions', key],
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
      if (key && context?.prevSolutions) {
        queryClient.setQueryData(['solutions', key], context.prevSolutions);
      }
    },
    onSettled: () => {
      if (key) {
        queryClient.invalidateQueries({ queryKey: ['solutions', key] });
      }
    },
  });
};

export const useAcceptSolution = (solutionId: number, challengeId: number | string) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/solutions/${solutionId}/accept/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', key] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
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

export interface SolutionUpdatePayload extends Partial<SolutionCreatePayload> {
  revision_note?: string;
}

export const useUpdateSolution = (solutionId: number, challengeId: number | string) => {
  const queryClient = useQueryClient();
  const key = String(challengeId);
  return useMutation({
    mutationFn: async (payload: SolutionUpdatePayload): Promise<Solution> => {
      const { data } = await apiClient.patch<Solution>(`/solutions/${solutionId}/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions', key] });
      queryClient.invalidateQueries({ queryKey: ['solution-revisions', solutionId] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
    },
  });
};

export const useUserSolutions = (username: string | undefined) => {
  return useQuery({
    queryKey: ['user-solutions', username],
    queryFn: async (): Promise<Solution[]> => {
      const { data } = await apiClient.get<Solution[] | PaginatedResponse<Solution>>('/solutions/', {
        params: { author: username },
      });
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!username,
  });
};
