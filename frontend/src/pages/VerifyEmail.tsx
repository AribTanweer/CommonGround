import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Globe2 } from 'lucide-react';
import { useVerifyEmail } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { extractApiError } from '@/lib/authValidation';
import { Button } from '@/components/ui/button';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, refreshUser } = useAuth();
  const verifyMutation = useVerifyEmail();
  const attemptedRef = useRef(false);

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const hasParams = Boolean(uid && token);

  useEffect(() => {
    if (!hasParams || attemptedRef.current) return;
    attemptedRef.current = true;
    verifyMutation.mutate(
      { uid, token },
      {
        onSuccess: () => {
          if (isAuthenticated) {
            refreshUser();
          }
        },
      }
    );
  }, [hasParams, uid, token]);

  const errorMessage = verifyMutation.isError
    ? extractApiError(
        verifyMutation.error,
        'This verification link is invalid or has already been used.'
      ).summary
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 shadow-sm text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-primary font-extrabold text-lg">
          <Globe2 className="h-5 w-5" />
          <span>CommonGround</span>
        </div>

        {!hasParams ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Invalid Verification Link</h1>
            <p className="text-sm text-muted-foreground">
              This verification link is missing required parameters. You can request a new one from Account Settings.
            </p>
            <Link to={isAuthenticated ? '/settings' : '/login'}>
              <Button className="w-full rounded-xl gap-2 mt-2">
                <span>{isAuthenticated ? 'Go to Account Settings' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : verifyMutation.isPending ? (
          <div className="space-y-4 py-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Verifying your email...</h1>
            <p className="text-sm text-muted-foreground">Please wait a moment.</p>
          </div>
        ) : verifyMutation.isSuccess ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Email Verified!</h1>
            <p className="text-sm text-muted-foreground">
              Your email address has been confirmed. Thank you for helping keep CommonGround trusted.
            </p>
            <Link to={isAuthenticated ? '/explore' : '/login'}>
              <Button className="w-full rounded-xl gap-2 mt-2">
                <span>{isAuthenticated ? 'Explore Challenges' : 'Continue to Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Verification Failed</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link to={isAuthenticated ? '/settings' : '/login'}>
              <Button variant="outline" className="w-full rounded-xl gap-2 mt-2">
                <span>{isAuthenticated ? 'Request New Link in Settings' : 'Back to Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
