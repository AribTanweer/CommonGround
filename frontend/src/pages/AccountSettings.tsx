import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  Send,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useChangePassword, useResendVerification, useUpdateProfile } from '@/api/auth';
import { evaluatePasswordStrength, extractApiError } from '@/lib/authValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const AccountSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const resendMutation = useResendVerification();
  const changePwMutation = useChangePassword();
  const profileMutation = useUpdateProfile();

  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleEmailPreference = (enabled: boolean) => {
    profileMutation.mutate({ email_notifications_enabled: enabled }, {
      onSuccess: async () => {
        await refreshUser();
        toast({ title: 'Email preferences updated', description: 'Your notification preference has been saved.', variant: 'success' });
      },
      onError: (err) => {
        const { summary } = extractApiError(err, 'Could not update email preferences.');
        toast({ title: 'Update failed', description: summary, variant: 'error' });
      },
    });
  };

  const handleLocationPrivacy = (enabled: boolean) => {
    profileMutation.mutate({ show_location_publicly: enabled }, {
      onSuccess: async () => {
        await refreshUser();
        toast({ title: 'Location privacy updated', description: enabled ? 'Your profile location is visible publicly.' : 'Your profile location is private.' });
      },
      onError: (err) => {
        const { summary } = extractApiError(err, 'Could not update location privacy.');
        toast({ title: 'Update failed', description: summary, variant: 'error' });
      },
    });
  };

  const handleProfilePrivacy = (enabled: boolean) => {
    profileMutation.mutate({ profile_is_public: enabled }, {
      onSuccess: async () => {
        await refreshUser();
        toast({ title: 'Profile privacy updated', description: enabled ? 'Your bio and avatar are public.' : 'Your bio, avatar, and location are hidden from public profiles.' });
      },
      onError: (err) => {
        const { summary } = extractApiError(err, 'Could not update profile privacy.');
        toast({ title: 'Update failed', description: summary, variant: 'error' });
      },
    });
  };

  const handleResend = () => {
    resendMutation.mutate(undefined, {
      onSuccess: (data) => {
        setDevVerifyUrl(data.dev_verify_url || null);
        toast({
          title: 'Verification email sent',
          description: data.detail,
          variant: 'success',
        });
      },
      onError: (err) => {
        const { summary } = extractApiError(err, 'Could not send verification email.');
        toast({ title: 'Error', description: summary, variant: 'error' });
      },
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (!strength.checks.minLength) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwError(null);
    changePwMutation.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: (data) => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          toast({
            title: 'Password updated',
            description: data.detail,
            variant: 'success',
          });
        },
        onError: (err) => {
          const { summary } = extractApiError(err, 'Failed to update password.');
          setPwError(summary);
        },
      }
    );
  };

  return (
    <div className="container max-w-3xl py-10 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Account &amp; Security
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your email verification status and password security.
          </p>
        </div>
        {user && (
          <Link to={`/profile/${user.username}`}>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <UserIcon className="h-4 w-4" />
              <span>View Profile</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Email Verification Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground">Email Verification</h2>
                {user?.is_email_verified ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email || 'No email set'}
              </p>
            </div>
          </div>

          {!user?.is_email_verified && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="gap-1.5 rounded-xl shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{resendMutation.isPending ? 'Sending...' : 'Resend Email'}</span>
            </Button>
          )}
        </div>

        {!user?.is_email_verified && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Verify your email address to earn the verified badge on your profile and ensure you can always recover your account.
          </p>
        )}

        {devVerifyUrl && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Local Development Mode
            </p>
            <a
              href={devVerifyUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline break-all"
            >
              <span>Open Email Verification Link</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Email Preferences</h2>
            <p className="text-xs text-muted-foreground">Choose whether CommonGround emails you about community activity.</p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={user?.email_notifications_enabled ?? true}
            disabled={profileMutation.isPending}
            onChange={(event) => handleEmailPreference(event.target.checked)}
          />
          <span>Send me email notifications about activity on challenges I follow and content I participate in.</span>
        </label>
        {!user?.is_email_verified && <p className="text-xs text-muted-foreground">Verify your email before activity notifications can be sent.</p>}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserIcon className="h-5 w-5" /></div>
          <div><h2 className="text-base font-bold text-foreground">Profile privacy</h2><p className="text-xs text-muted-foreground">Choose which profile details appear publicly.</p></div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={user?.profile_is_public ?? true} disabled={profileMutation.isPending} onChange={(event) => handleProfilePrivacy(event.target.checked)} />
          <span>Show my bio and avatar publicly</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={user?.show_location_publicly ?? false} disabled={profileMutation.isPending} onChange={(event) => handleLocationPrivacy(event.target.checked)} />
          <span>Show my location publicly on my profile</span>
        </label>
      </div>

      {/* Change Password Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground">
              Update your password regularly to keep your account secure.
            </p>
          </div>
        </div>

        {pwError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-pw"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (pwError) setPwError(null);
                }}
                className="pl-10 pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-pw"
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (pwError) setPwError(null);
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
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-pw"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (pwError) setPwError(null);
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
              <p className={`text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-destructive'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={changePwMutation.isPending}
            className="rounded-xl font-semibold"
          >
            {changePwMutation.isPending ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};
