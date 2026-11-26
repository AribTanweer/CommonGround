import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const isSuccess = item.variant === 'success';
        const isError = item.variant === 'error';

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 ${
              isError
                ? 'border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20'
                : isSuccess
                ? 'border-emerald-500/40 bg-card text-foreground'
                : 'border-border bg-card text-foreground'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Info className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
