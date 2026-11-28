import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Compass,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImpactCounter } from '@/components/ImpactCounter';
import { ChallengeCard } from '@/components/ChallengeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/api/challenges';
import { useStats } from '@/api/stats';

export const Landing: React.FC = () => {
  const { data: challengesData, isLoading: challengesLoading } = useChallenges({
    ordering: '-support_count',
  });
  const { data: stats } = useStats();

  const featured = challengesData?.results?.slice(0, 3) || [];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-24 pb-8">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="container px-4 md:px-6 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-2 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Civic Collaboration Reimagined</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Turn Community Problems into{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-600 to-amber-500 bg-clip-text text-transparent">
              Collaborative Solutions
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Citizens post real local and societal issues, validate community priorities,
            propose actionable solutions, and transparently track progress to resolution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/explore">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 shadow-md">
                <Compass className="h-5 w-5" />
                <span>Explore Challenges</span>
              </Button>
            </Link>
            <Link to="/challenges/new">
              <Button size="lg" variant="cta" className="w-full sm:w-auto gap-2 text-base px-8 shadow-md">
                <PlusCircle className="h-5 w-5" />
                <span>Post a Challenge</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Animated Impact Counters */}
      <section className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 rounded-3xl border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col items-center text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 mb-3">
              <Compass className="h-6 w-6" />
            </div>
            <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
              <ImpactCounter value={stats?.total_challenges ?? 0} />
            </p>
            <p className="text-sm font-medium text-muted-foreground">Challenges Posted</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 border-y sm:border-y-0 sm:border-x border-border/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-3">
              <Lightbulb className="h-6 w-6" />
            </div>
            <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
              <ImpactCounter value={stats?.total_solutions ?? 0} />
            </p>
            <p className="text-sm font-medium text-muted-foreground">Solutions Proposed</p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
              <ImpactCounter value={stats?.resolved_count ?? 0} />
            </p>
            <p className="text-sm font-medium text-muted-foreground">Issues Resolved</p>
          </div>
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="container px-4 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Trending in Communities</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Featured Challenges
            </h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span>View all challenges</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {challengesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl border p-5 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No challenges available at the moment.
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="container px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-foreground">How CommonGround Works</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A transparent, crowdsourced lifecycle designed to turn awareness into verified local impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Identify & Validate</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Post real issues with photos and location. Fellow citizens support the challenge to prioritize urgent needs.
            </p>
          </div>

          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-4 font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Collaborate on Solutions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Engineers, students, and neighbors propose actionable plans with cost and effort breakdowns, refined via comments.
            </p>
          </div>

          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4 font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Execute & Resolve</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The accepted solution moves to execution. Progress is tracked step-by-step until the problem is officially resolved.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="container px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-700 to-indigo-900 px-8 py-14 md:p-16 text-white text-center shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to Make a Difference in Your Area?
            </h2>
            <p className="text-indigo-100 text-base md:text-lg leading-relaxed">
              Join thousands of active problem solvers and civic champions on CommonGround today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link to="/register">
                <Button size="lg" variant="cta" className="w-full sm:w-auto text-base px-8 shadow-lg">
                  Join CommonGround
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                  Browse Challenges
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
