import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Award,
  Sparkles,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { useUserProfile } from '@/api/auth';
import { useChallenges } from '@/api/challenges';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChallengeCard } from '@/components/ChallengeCard';
import { formatDate } from '@/lib/utils';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  const targetUsername = username || currentUser?.username;
  const { data: userProfile, isLoading, isError } = useUserProfile(targetUsername);

  // Fetch challenges by this user
  const { data: userChallengesData, isLoading: challengesLoading } = useChallenges({
    search: targetUsername,
  });

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

  const userChallenges = userChallengesData?.results || [];

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
                {userProfile.reputation >= 50 && (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Contributor
                  </Badge>
                )}
              </div>

              {userProfile.bio && (
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  {userProfile.bio}
                </p>
              )}

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

        {/* Badges Placeholder Showcase */}
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
        <TabsList className="grid grid-cols-2 w-72">
          <TabsTrigger value="challenges" className="gap-2">
            <Compass className="h-4 w-4" />
            <span>Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="solutions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Solutions</span>
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
          <div className="p-12 text-center border rounded-2xl bg-card space-y-2">
            <Lightbulb className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold">Active Solution Proposals</p>
            <p className="text-xs text-muted-foreground">
              Participating in discussions and proposing actionable steps for the community.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
