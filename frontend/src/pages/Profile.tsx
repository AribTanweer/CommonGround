import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Award,
  Sparkles,
  Compass,
  Lightbulb,
  Pencil,
  CheckCircle2,
  ThumbsUp,
  ArrowUpRight,
} from 'lucide-react';
import { useUserProfile, useUpdateProfile } from '@/api/auth';
import { useChallenges } from '@/api/challenges';
import { useUserSolutions } from '@/api/solutions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChallengeCard } from '@/components/ChallengeCard';
import { formatDate, timeAgo } from '@/lib/utils';
import { EFFORT_LEVELS } from '@/lib/constants';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const targetUsername = username || currentUser?.username;
  const { data: userProfile, isLoading, isError } = useUserProfile(targetUsername);
  const updateProfileMutation = useUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');

  // Fetch challenges and solutions authored by this user
  const { data: userChallengesData, isLoading: challengesLoading } = useChallenges(
    { author: targetUsername },
    !!targetUsername
  );
  const { data: userSolutions = [], isLoading: solutionsLoading } =
    useUserSolutions(targetUsername);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !userProfile) {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The user profile could not be found.
        </p>
        <Link to="/explore">
          <span className="text-primary font-semibold hover:underline">
            Back to Explore
          </span>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === userProfile.username;
  const userChallenges = userChallengesData?.results || [];

  const handleOpenEdit = () => {
    setBio(userProfile.bio || '');
    setLocation(userProfile.location || '');
    setAvatar(userProfile.avatar || '');
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(
      {
        bio: bio.trim(),
        location: location.trim(),
        avatar: avatar.trim() || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Profile updated',
            description: 'Your civic profile changes have been saved.',
            variant: 'success',
          });
          setEditOpen(false);
        },
        onError: () => {
          toast({
            title: 'Could not update profile',
            description: 'Please check your inputs and try again.',
            variant: 'error',
          });
        },
      }
    );
  };

  return (
    <div className="container max-w-5xl py-10 px-4 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-md">
              <AvatarImage src={userProfile.avatar || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary uppercase">
                {userProfile.username[0]}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-foreground">
                  {userProfile.username}
                </h1>
                {userProfile.is_email_verified && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Email Verified
                  </Badge>
                )}
                {userProfile.reputation >= 50 && (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Contributor
                  </Badge>
                )}
                {isOwnProfile && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEdit}
                      className="h-7 gap-1.5 rounded-lg text-xs"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Profile</span>
                    </Button>
                    <Link to="/settings">
                      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg text-xs">
                        <span>{userProfile.is_email_verified ? 'Security' : 'Verify Email'}</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {userProfile.bio ? (
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  {userProfile.bio}
                </p>
              ) : isOwnProfile ? (
                <p className="text-xs italic text-muted-foreground">
                  Add a short bio to let neighbors know your civic interests.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
                {userProfile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {userProfile.location}
                  </span>
                )}
                {userProfile.date_joined && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {formatDate(userProfile.date_joined)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reputation Badge Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center min-w-[140px] w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
              Reputation
            </span>
            <span className="text-3xl font-extrabold text-primary">
              {userProfile.reputation}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">Community Score</span>
          </div>
        </div>

        {/* Badges Showcase */}
        <div className="mt-8 pt-6 border-t border-border/60 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Earned Civic Badges</span>
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>Civic Pioneer</span>
            </div>
            {userProfile.reputation >= 20 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Problem Solver</span>
              </div>
            )}
            {userProfile.reputation >= 50 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Trusted Voice</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Activity Tabs */}
      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-80">
          <TabsTrigger value="challenges" className="gap-2">
            <Compass className="h-4 w-4" />
            <span>Challenges ({userChallenges.length})</span>
          </TabsTrigger>
          <TabsTrigger value="solutions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Solutions ({userSolutions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="pt-2">
          {challengesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : userChallenges.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card space-y-2">
              <Compass className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold">No challenges posted yet</p>
              <p className="text-xs text-muted-foreground">
                Challenges posted by {userProfile.username} will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solutions" className="pt-2">
          {solutionsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : userSolutions.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card space-y-2">
              <Lightbulb className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold">No solution proposals yet</p>
              <p className="text-xs text-muted-foreground">
                Action plans proposed by {userProfile.username} will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userSolutions.map((sol) => {
                const effort =
                  EFFORT_LEVELS.find((e) => e.value === sol.effort_level) || EFFORT_LEVELS[1];
                return (
                  <Link
                    key={sol.id}
                    to={`/challenges/${sol.challenge}`}
                    className="block rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>For challenge:</span>
                        <span className="font-semibold text-primary group-hover:underline inline-flex items-center gap-1">
                          {sol.challenge_title || `Challenge #${sol.challenge}`}
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sol.is_accepted && (
                          <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted
                          </Badge>
                        )}
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${effort.color}`}
                        >
                          {effort.label}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors mb-1">
                      {sol.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {sol.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span>Proposed {timeAgo(sol.created_at)}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {sol.score} score
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Civic Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-location">Neighborhood / Location</Label>
              <Input
                id="profile-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. East Ward, Downtown"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell neighbors what civic topics you care about..."
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-avatar">Avatar Image URL (Optional)</Label>
              <Input
                id="profile-avatar"
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
