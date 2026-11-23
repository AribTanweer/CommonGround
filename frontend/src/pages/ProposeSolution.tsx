import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lightbulb, DollarSign, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { useCreateSolution } from '@/api/solutions';
import { useChallenge } from '@/api/challenges';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EFFORT_LEVELS } from '@/lib/constants';

interface ProposeSolutionFormProps {
  challengeId: number | string;
  onSuccess?: () => void;
}

export const ProposeSolutionForm: React.FC<ProposeSolutionFormProps> = ({
  challengeId,
  onSuccess,
}) => {
  const { isAuthenticated } = useAuth();
  const createMutation = useCreateSolution(challengeId);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [effortLevel, setEffortLevel] = useState<'low' | 'med' | 'high'>('med');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          You must be signed in to submit a solution proposal.
        </p>
        <Link to="/login">
          <Button size="sm">Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setError('Please provide both a proposal title and a detailed summary.');
      return;
    }

    setError(null);
    createMutation.mutate(
      {
        title: title.trim(),
        summary: summary.trim(),
        estimated_cost: estimatedCost.trim() || undefined,
        effort_level: effortLevel,
      },
      {
        onSuccess: () => {
          setTitle('');
          setSummary('');
          setEstimatedCost('');
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.detail ||
            'Failed to submit solution proposal. Please check your inputs.';
          setError(msg);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="sol-title">Proposal Title *</Label>
        <Input
          id="sol-title"
          placeholder="e.g. Solar LED Installation & Community Maintenance Schedule"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sol-summary">Action Plan & Summary *</Label>
        <Textarea
          id="sol-summary"
          placeholder="Detail the step-by-step approach, materials needed, and how this directly solves the problem..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          className="resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sol-cost">Estimated Cost (Optional)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="sol-cost"
              placeholder="e.g. $1,200 or Zero (Volunteer)"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sol-effort">Effort Level *</Label>
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {EFFORT_LEVELS.map((effort) => (
              <button
                key={effort.value}
                type="button"
                onClick={() => setEffortLevel(effort.value)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  effortLevel === effort.value
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border/80 text-muted-foreground hover:bg-muted'
                }`}
              >
                {effort.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t">
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="gap-2 rounded-xl"
        >
          <Send className="h-4 w-4" />
          <span>{createMutation.isPending ? 'Submitting...' : 'Submit Proposal'}</span>
        </Button>
      </div>
    </form>
  );
};

export const ProposeSolution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: challenge } = useChallenge(id);

  if (!id) return null;

  return (
    <div className="container max-w-2xl py-10 px-4 space-y-6">
      <Link
        to={`/challenges/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Challenge</span>
      </Link>

      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Lightbulb className="h-4 w-4" />
          <span>Collaborative Problem-Solving</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Propose Solution for: {challenge?.title || 'Challenge'}
        </h1>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <ProposeSolutionForm
          challengeId={id}
          onSuccess={() => navigate(`/challenges/${id}`)}
        />
      </div>
    </div>
  );
};
