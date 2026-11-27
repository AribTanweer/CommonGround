import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Globe2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useConfirmPasswordReset } from '@/api/auth';
import { useToast } from '@/context/ToastContext';
import { evaluatePasswordStrength, extractApiError } from '@/lib/authValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmMutation = useConfirmPasswordReset();

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const hasValidParams = Boolean(uid && token);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strength.checks.minLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    confirmMutation.mutate(
      { uid, token, new_password: newPassword, confirm_password: confirmPassword },
      {
        onSuccess: (data) => {
          setDone(true);
          toast({
            title: 'Password reset',
            description: data.detail,
            variant: 'success',
          });
        },
        onError: (err) => {
          const { summary } = extractApiError(
            err,
            'This reset link is invalid or has expired. Please request a new one.'
          );
          setError(summary);
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-7">
          {!hasValidParams ? (
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Invalid Reset Link
                </h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link is missing required verification parameters or has expired.
                </p>
              </div>
              <Link to="/forgot-password">
                <Button className="rounded-xl gap-2">
                  <span>Request a New Link</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Password updated
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new credentials.
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full rounded-xl h-11 gap-2 font-semibold"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Set a new password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a strong password that you don&apos;t use on other websites.
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
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className="font-semibold text-foreground">{strength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-colors ${
                              strength.score >= step ? strength.barColor : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                        <span className={`inline-flex items-center gap-1 ${strength.checks.minLength ? 'text-emerald-600' : ''}`}>
                          <Check className="h-3 w-3" /> 8+ chars
                        </span>
                        <span className={`inline-flex items-center gap-1 ${strength.checks.hasLetter ? 'text-emerald-600' : ''}`}>
                          <Check className="h-3 w-3" /> Letter
                        </span>
                        <span className={`inline-flex items-center gap-1 ${strength.checks.hasNumber ? 'text-emerald-600' : ''}`}>
                          <Check className="h-3 w-3" /> Number
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p
                      className={`text-xs ${
                        passwordsMatch ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={confirmMutation.isPending}
                  className="w-full gap-2 rounded-xl h-11 text-base font-semibold shadow-md"
                >
                  {confirmMutation.isPending ? 'Updating Password...' : 'Reset Password'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Globe2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">CommonGround</span>
        </div>

        <div className="space-y-4 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Secure Account Update
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Protect your civic profile and reputation.
          </h2>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Use a mix of letters, numbers, and symbols for maximum account security.
          </p>
        </div>

        <div className="text-xs text-indigo-300">
          Built for civil dialogue and real action.
        </div>
      </div>
    </div>
  );
};
