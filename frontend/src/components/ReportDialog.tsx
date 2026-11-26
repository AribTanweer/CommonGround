import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useReport } from '@/api/engagement';
import { useToast } from '@/context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'challenge' | 'solution' | 'comment';
  targetId: number;
}

const PRESET_REASONS = [
  'Spam or promotional content',
  'Harassment or abusive language',
  'Misinformation or off-topic',
  'Duplicate submission',
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  targetType,
  targetId,
}) => {
  const [reason, setReason] = useState('');
  const reportMutation = useReport();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;

    const payload =
      targetType === 'challenge'
        ? { challenge: targetId, reason: trimmed }
        : targetType === 'solution'
        ? { solution: targetId, reason: trimmed }
        : { comment: targetId, reason: trimmed };

    reportMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: 'Report submitted',
          description: 'Thank you for helping keep CommonGround constructive and safe.',
          variant: 'success',
        });
        setReason('');
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: 'Could not submit report',
          description: 'Please sign in and try again.',
          variant: 'error',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            <span>Report {targetType}</span>
          </DialogTitle>
          <DialogDescription>
            Let moderators know why this {targetType} violates community guidelines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  reason === preset
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue..."
            rows={3}
            className="text-sm resize-none"
            required
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason.trim() || reportMutation.isPending}
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
