import React from 'react';
import { Check, CircleDot, AlertCircle } from 'lucide-react';
import { ChallengeStatus, STATUS_STEPS } from '@/lib/constants';

interface StatusStepperProps {
  status: ChallengeStatus;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  status,
  orientation = 'vertical',
  className = '',
}) => {
  if (status === 'closed') {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-xl bg-muted/70 p-3.5 border border-border text-muted-foreground ${className}`}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium text-xs leading-snug">
          This challenge has been closed / archived.
        </span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  if (orientation === 'vertical') {
    return (
      <div className={`w-full pt-1 ${className}`}>
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === STATUS_STEPS.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Indicator + Vertical Connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : isCurrent
                      ? 'border-primary bg-background ring-4 ring-primary/15 text-primary font-bold shadow-sm'
                      : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <CircleDot className="h-4 w-4 animate-pulse" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[22px] my-1 rounded-full transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Label + Description */}
              <div className={isLast ? 'pb-0.5 pt-0.5' : 'pb-4 pt-0.5'}>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold leading-tight transition-colors ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full py-3 ${className}`}>
      <div className="relative flex items-start justify-between gap-2">
        {/* Track Line aligned with the center of h-10 (40px -> top-5) circles */}
        <div className="absolute left-8 right-8 top-5 -translate-y-1/2 h-1 bg-muted rounded-full z-0">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{
              width: `${(Math.max(0, currentIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-1 flex-col items-center group">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : isCurrent
                    ? 'border-primary bg-background ring-4 ring-primary/20 text-primary font-bold shadow-md'
                    : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <CircleDot className="h-4 w-4 animate-pulse" />
                ) : (
                  <span className="text-xs font-semibold">{idx + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center px-1">
                <p
                  className={`text-xs font-semibold transition-colors leading-tight ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                <p className="hidden md:block mt-0.5 text-[11px] text-muted-foreground leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
