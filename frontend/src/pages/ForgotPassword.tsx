import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe2,
  Mail,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useRequestPasswordReset } from '@/api/auth';
import { EMAIL_PATTERN, extractApiError } from '@/lib/authValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ForgotPassword: React.FC = () => {
  const resetMutation = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your account email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    resetMutation.mutate(trimmed, {
      onSuccess: (data) => {
        setSubmitted(true);
        setDevResetUrl(data.dev_reset_url || null);
      },
      onError: (err) => {
        const { summary } = extractApiError(err, 'Unable to process reset request. Please try again.');
        setError(summary);
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left side: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>

          {submitted ? (
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Check your inbox
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <span className="font-semibold text-foreground">{email.trim()}</span>, we&apos;ve sent a password reset link (valid for 30 minutes). Please check your spam folder if you don&apos;t see it within a minute.
                </p>
              </div>

              {devResetUrl && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Local Development Mode
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SMTP is not configured locally, so you can open the reset link directly:
                  </p>
                  <a
                    href={devResetUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline break-all"
                  >
                    <span>Open Password Reset Page</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setDevResetUrl(null);
                  }}
                  className="rounded-xl"
                >
                  Try another email
                </Button>
                <Link to="/login" className="flex-1">
                  <Button className="w-full rounded-xl">Return to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Forgot password?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full gap-2 rounded-xl h-11 text-base font-semibold shadow-md"
                >
                  {resetMutation.isPending ? 'Sending Reset Link...' : 'Send Reset Link'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Right side: Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Globe2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">CommonGround</span>
        </div>

        <div className="space-y-4 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Account Recovery
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Get back to collaborating with your community in moments.
          </h2>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Password reset links are single-use and expire automatically to keep your account secure.
          </p>
        </div>

        <div className="text-xs text-indigo-300">
          Empowering communities to solve real problems together.
        </div>
      </div>
    </div>
  );
};
