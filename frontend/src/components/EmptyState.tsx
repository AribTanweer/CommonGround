import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 ring-8 ring-primary/5">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" className="shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
