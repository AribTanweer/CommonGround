import React from 'react';
import { Check, CircleDot, AlertCircle } from 'lucide-react';
import { ChallengeStatus, STATUS_STEPS } from '@/lib/constants';

interface StatusStepperProps {
  status: ChallengeStatus;
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ status, className = '' }) => {
  if (status === 'closed') {
    return (
      <div className={`flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 ${className}`}>
        <AlertCircle className="h-5 w-5 text-gray-500" />
        <span className="font-semibold text-sm">This challenge has been closed / archived.</span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Track Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full -z-0">
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
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : isCurrent
                    ? 'border-primary bg-background ring-4 ring-primary/20 text-primary font-bold shadow-md'
                    : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <CircleDot className="h-5 w-5 animate-pulse" />
                ) : (
                  <span className="text-xs font-semibold">{idx + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs md:text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                <p className="hidden md:block text-[11px] text-muted-foreground max-w-[110px] truncate">
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
