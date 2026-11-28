import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe2,
  Lock,
  User as UserIcon,
  Mail,
  MapPin,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  evaluatePasswordStrength,
  extractApiError,
} from '@/lib/authValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    location: '',
    bio: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = evaluatePasswordStrength(form.password);
  const passwordsMatch = form.password2.length > 0 && form.password === form.password2;

  const validateClient = () => {
    const errs: Record<string, string> = {};
    const username = form.username.trim();
    const email = form.email.trim();

    if (!USERNAME_PATTERN.test(username)) {
      errs.username =
        'Use 3–30 characters: letters, numbers, underscores, dots, or hyphens.';
    }
    if (!EMAIL_PATTERN.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }
    if (form.password !== form.password2) {
      errs.password2 = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError('Please fix the highlighted fields below.');
      return;
    }

    setFieldErrors({});
    setError(null);
    setLoading(true);

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password2: form.password2,
        location: form.location.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      toast({
        title: 'Account created',
        description: `Welcome, ${form.username.trim()}! Check your inbox to verify your email.`,
        variant: 'success',
      });
      navigate('/explore');
    } catch (err) {
      const { summary, fields } = extractApiError(
        err,
        'Failed to create account. Please check your details and try again.'
      );
      setFieldErrors(fields);
      setError(summary);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (error) setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left side: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Join CommonGround and start proposing solutions for your neighborhood
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="reg-username">Username *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-username"
                  type="text"
                  placeholder="e.g. sara_activist"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className={`pl-10 ${fieldErrors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="username"
                  required
                />
              </div>
              {fieldErrors.username ? (
                <p className="text-xs text-destructive">{fieldErrors.username}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  3–30 characters (letters, numbers, _, ., -)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="sara@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`pl-10 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`pl-10 pr-10 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="new-password"
                  required
                  minLength={8}
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
              {form.password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Strength</span>
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
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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

            <div className="space-y-1.5">
              <Label htmlFor="reg-password2">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-password2"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.password2}
                  onChange={(e) => updateField('password2', e.target.value)}
                  className={`pl-10 pr-10 ${fieldErrors.password2 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
              {fieldErrors.password2 ? (
                <p className="text-xs text-destructive">{fieldErrors.password2}</p>
              ) : (
                form.password2.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-destructive'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-location">City / Community Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-location"
                  type="text"
                  placeholder="e.g. Austin, TX or North District"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-bio">Short Bio (Optional)</Label>
              <Textarea
                id="reg-bio"
                placeholder="What community topics do you care about?"
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 rounded-xl h-11 text-base font-semibold shadow-md mt-2"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Branding / Illustration */}
      <div className="auth-story-panel hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Globe2 className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl tracking-normal text-foreground">CommonGround</span>
        </div>

        <div className="auth-story-content space-y-6 max-w-lg z-10">
          <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
            A stronger neighborhood starts here
          </div>
          <h2 className="font-display text-3xl leading-snug text-foreground">
            Turn the things you care about into work you can do together.
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ +10 points when your challenge hits 10 community supports</p>
            <p>✓ +5 points per solution upvote</p>
            <p>✓ +50 points when your solution is accepted by the challenge owner</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Built for civil dialogue and real action.
        </div>
      </div>
    </div>
  );
};
