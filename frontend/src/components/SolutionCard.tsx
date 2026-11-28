import React, { useState } from 'react';
import { CheckCircle2, History, DollarSign, Activity, Pencil, Flag } from 'lucide-react';
import { Solution } from '@/api/types';
import { EFFORT_LEVELS } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { VoteButton } from './VoteButton';
import { ConfirmDialog } from './ui/confirm-dialog';
import { ReportDialog } from './ReportDialog';
import {
  useVoteSolution,
  useAcceptSolution,
  useSolutionRevisions,
  useUpdateSolution,
} from '@/api/solutions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  const { toast } = useToast();
  const [showRevisions, setShowRevisions] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(solution.title);
  const [editSummary, setEditSummary] = useState(solution.summary);
  const [editCost, setEditCost] = useState(solution.estimated_cost || '');
  const [editEffort, setEditEffort] = useState<'low' | 'med' | 'high'>(solution.effort_level);
  const [revisionNote, setRevisionNote] = useState('');

  const voteMutation = useVoteSolution(solution.id, challengeId);
  const acceptMutation = useAcceptSolution(solution.id, challengeId);
  const updateMutation = useUpdateSolution(solution.id, challengeId);
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
    acceptMutation.mutate(undefined, {
      onSuccess: () => {
        setAcceptConfirmOpen(false);
        toast({
          title: 'Solution accepted',
          description: 'The challenge has moved to In Progress.',
          variant: 'success',
        });
      },
      onError: () => {
        toast({
          title: 'Could not accept solution',
          description: 'Please try again.',
          variant: 'error',
        });
      },
    });
  };

  const handleOpenEdit = () => {
    setEditTitle(solution.title);
    setEditSummary(solution.summary);
    setEditCost(solution.estimated_cost || '');
    setEditEffort(solution.effort_level);
    setRevisionNote('');
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editSummary.trim()) return;
    updateMutation.mutate(
      {
        title: editTitle.trim(),
        summary: editSummary.trim(),
        estimated_cost: editCost.trim() || undefined,
        effort_level: editEffort,
        revision_note: revisionNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Proposal updated',
            description: 'A new revision snapshot has been saved.',
            variant: 'success',
          });
          setEditOpen(false);
        },
        onError: () => {
          toast({
            title: 'Update failed',
            description: 'Could not save your changes. Please try again.',
            variant: 'error',
          });
        },
      }
    );
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

            <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-4">
              {/* Revisions trigger */}
              <Dialog open={showRevisions} onOpenChange={setShowRevisions}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>
                      Revisions
                      {solution.revisions_count !== undefined && solution.revisions_count > 0
                        ? ` (${solution.revisions_count})`
                        : ''}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Solution Revision History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto pt-2">
                    {revisions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No previous revisions recorded.
                      </p>
                    ) : (
                      revisions.map((rev, idx) => (
                        <div key={rev.id} className="p-3.5 rounded-xl border bg-muted/30 text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-primary">
                              Revision #{revisions.length - idx} • {rev.editor?.username || 'Author'}
                            </span>
                            <span className="text-muted-foreground font-normal">
                              {timeAgo(rev.created_at)}
                            </span>
                          </div>
                          {rev.note && (
                            <p className="italic text-muted-foreground bg-background/70 px-2.5 py-1 rounded-lg border border-border/50">
                              Note: {rev.note}
                            </p>
                          )}
                          <p className="whitespace-pre-line text-foreground leading-relaxed">
                            {rev.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {isAuthor && (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Proposal</span>
                </button>
              )}

              {isAuthenticated && !isAuthor && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Flag className="h-3 w-3" />
                  <span>Report</span>
                </button>
              )}
            </div>

            {/* Accept solution button for challenge author */}
            {isChallengeOwner && !solution.is_accepted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAcceptConfirmOpen(true)}
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

      {/* Edit Proposal Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Solution Proposal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor={`sol-title-${solution.id}`}>Proposal Title</Label>
              <Input
                id={`sol-title-${solution.id}`}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`sol-summary-${solution.id}`}>Action Plan & Details</Label>
              <Textarea
                id={`sol-summary-${solution.id}`}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`sol-effort-${solution.id}`}>Effort Level</Label>
                <select
                  id={`sol-effort-${solution.id}`}
                  value={editEffort}
                  onChange={(e) => setEditEffort(e.target.value as 'low' | 'med' | 'high')}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">Low Effort</option>
                  <option value="med">Medium Effort</option>
                  <option value="high">High Effort</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`sol-cost-${solution.id}`}>Estimated Cost (Optional)</Label>
                <Input
                  id={`sol-cost-${solution.id}`}
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  placeholder="e.g. $500 or Volunteer-led"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`sol-note-${solution.id}`}>Revision Note (Optional)</Label>
              <Input
                id={`sol-note-${solution.id}`}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="What changed in this revision?"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={acceptConfirmOpen}
        onOpenChange={setAcceptConfirmOpen}
        title="Accept this solution?"
        description="Marking this proposal as accepted will move the challenge status to In Progress and recognize the contributor."
        confirmLabel="Accept Solution"
        isPending={acceptMutation.isPending}
        onConfirm={handleAccept}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="solution"
        targetId={solution.id}
      />
    </div>
  );
};
