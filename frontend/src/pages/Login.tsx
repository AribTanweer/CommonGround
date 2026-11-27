import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe2, Lock, User as UserIcon, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { extractApiError } from '@/lib/authValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/explore';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      nextErrors.identifier = 'Username or email is required.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please enter your credentials to continue.');
      return;
    }

    setFieldErrors({});
    setError(null);
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      toast({
        title: 'Welcome back',
        description: 'You are now signed in to CommonGround.',
        variant: 'success',
      });
      navigate(from, { replace: true });
    } catch (err) {
      const { summary } = extractApiError(
        err,
        'Invalid username/email or password. Please try again.'
      );
      setError(summary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left side: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your username or email to access your CommonGround account
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Username or Email</Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="e.g. alex_civic or alex@example.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
                    if (error) setError(null);
                  }}
                  className={`pl-10 ${fieldErrors.identifier ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="username"
                  required
                />
              </div>
              {fieldErrors.identifier && (
                <p className="text-xs text-destructive">{fieldErrors.identifier}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    if (error) setError(null);
                  }}
                  className={`pl-10 pr-10 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 rounded-xl h-11 text-base font-semibold shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Branding / Illustration */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Globe2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">CommonGround</span>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Community-Powered Impact
          </div>
          <blockquote className="text-2xl font-semibold leading-relaxed">
            &ldquo;When everyday citizens have a structured way to identify challenges and propose concrete solutions, cities transform from the inside out.&rdquo;
          </blockquote>
          <div>
            <p className="font-bold">Collaborative Civic Platform</p>
            <p className="text-sm text-indigo-200">CommonGround Ecosystem</p>
          </div>
        </div>

        <div className="text-xs text-indigo-300">
          Empowering communities to solve real problems together.
        </div>
      </div>
    </div>
  );
};
