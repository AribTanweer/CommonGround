import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2, Lock, User as UserIcon, Mail, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    location: '',
    bio: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all required fields (username, email, password).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        location: form.location.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      navigate('/explore');
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        (data && typeof data === 'object'
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : 'Failed to create account. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="reg-username">Username *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-username"
                  type="text"
                  placeholder="e.g. sara_activist"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
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
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
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
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Globe2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">CommonGround</span>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Citizen Reputation & Recognition
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Earn reputation by identifying challenges and proposing winning solutions.
          </h2>
          <div className="space-y-2 text-sm text-indigo-200">
            <p>✓ +10 points when your challenge hits 10 community supports</p>
            <p>✓ +5 points per solution upvote</p>
            <p>✓ +50 points when your solution is accepted by the challenge owner</p>
          </div>
        </div>

        <div className="text-xs text-indigo-300">
          Built for civil dialogue and real action.
        </div>
      </div>
    </div>
  );
};
