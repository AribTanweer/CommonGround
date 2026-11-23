import React from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteButtonProps {
  score: number;
  userVote?: number; // 1, -1, or 0
  onVote: (val: 1 | -1) => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  score,
  userVote = 0,
  onVote,
  disabled = false,
  orientation = 'vertical',
  className = '',
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 transition-colors',
        orientation === 'vertical' ? 'flex-col space-y-0.5' : 'flex-row space-x-1.5',
        className
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onVote(1);
        }}
        aria-label="Upvote"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90',
          userVote === 1
            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
            : 'text-muted-foreground hover:bg-background hover:text-amber-600 disabled:opacity-50'
        )}
      >
        <ArrowBigUp className={cn('h-5 w-5', userVote === 1 && 'fill-current')} />
      </button>

      <span
        className={cn(
          'px-1.5 text-xs font-bold transition-colors select-none text-center min-w-[20px]',
          userVote === 1
            ? 'text-amber-600 dark:text-amber-400 font-extrabold'
            : userVote === -1
            ? 'text-rose-600 dark:text-rose-400 font-extrabold'
            : 'text-foreground'
        )}
      >
        {score}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onVote(-1);
        }}
        aria-label="Downvote"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90',
          userVote === -1
            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
            : 'text-muted-foreground hover:bg-background hover:text-rose-600 disabled:opacity-50'
        )}
      >
        <ArrowBigDown className={cn('h-5 w-5', userVote === -1 && 'fill-current')} />
      </button>
    </div>
  );
};
