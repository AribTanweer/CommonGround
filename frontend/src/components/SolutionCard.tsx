import React, { useState } from 'react';
import { CheckCircle2, History, DollarSign, Activity } from 'lucide-react';
import { Solution } from '@/api/types';
import { EFFORT_LEVELS } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { VoteButton } from './VoteButton';
import { useVoteSolution, useAcceptSolution, useSolutionRevisions } from '@/api/solutions';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface SolutionCardProps {
  solution: Solution;
  challengeOwnerId?: number;
  challengeId: number | string;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  solution,
  challengeOwnerId,
  challengeId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [showRevisions, setShowRevisions] = useState(false);

  const voteMutation = useVoteSolution(solution.id, challengeId);
  const acceptMutation = useAcceptSolution(solution.id, challengeId);
  const { data: revisions = [] } = useSolutionRevisions(showRevisions ? solution.id : undefined);

  const isChallengeOwner = user?.id === challengeOwnerId;
  const isAuthor = user?.id === solution.author?.id;

  const effortConfig =
    EFFORT_LEVELS.find((e) => e.value === solution.effort_level) || EFFORT_LEVELS[1];

  const handleVote = (val: 1 | -1) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (isAuthor) return;
    voteMutation.mutate(val);
  };

  const handleAccept = () => {
    if (confirm('Are you sure you want to accept this solution for the challenge? This will move the challenge status to In Progress.')) {
      acceptMutation.mutate();
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-5 shadow-sm bg-card ${
        solution.is_accepted
          ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10'
          : 'border-border/80 hover:border-border'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Vote buttons column */}
        <div className="shrink-0 pt-1">
          <VoteButton
            score={solution.score}
            userVote={solution.user_vote}
            onVote={handleVote}
            disabled={isAuthor || !isAuthenticated}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarImage src={solution.author?.avatar || undefined} />
                <AvatarFallback className="text-[10px] uppercase font-bold bg-primary/10 text-primary">
                  {solution.author?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-foreground">
                {solution.author?.username || 'Contributor'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                • {timeAgo(solution.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {solution.is_accepted && (
                <Badge className="bg-emerald-600 text-white gap-1 py-0.5 shadow-sm font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accepted Solution
                </Badge>
              )}

              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${effortConfig.color}`}
              >
                <Activity className="h-3 w-3" />
                {effortConfig.label}
              </span>

              {solution.estimated_cost && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-muted/60 text-foreground">
                  <DollarSign className="h-3 w-3" />
                  {solution.estimated_cost}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-foreground mb-2 leading-snug">
            {solution.title}
          </h4>

          {/* Summary */}
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed mb-4">
            {solution.summary}
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            {/* Revisions trigger */}
            <Dialog open={showRevisions} onOpenChange={setShowRevisions}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Revision History</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Solution Revisions</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-80 overflow-y-auto pt-2">
                  {revisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No previous revisions recorded.</p>
                  ) : (
                    revisions.map((rev) => (
                      <div key={rev.id} className="p-3 rounded-xl border bg-muted/30 text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{rev.editor?.username}</span>
                          <span className="text-muted-foreground">{timeAgo(rev.created_at)}</span>
                        </div>
                        {rev.note && <p className="italic text-muted-foreground">{rev.note}</p>}
                        <p className="line-clamp-2 text-foreground">{rev.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Accept solution button for challenge author */}
            {isChallengeOwner && !solution.is_accepted && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
                className="gap-1.5 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as Accepted</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
