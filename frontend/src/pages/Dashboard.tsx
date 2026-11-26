import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Users,
  Compass,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { useStats, useLeaderboard } from '@/api/stats';
import { ImpactCounter } from '@/components/ImpactCounter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export const Dashboard: React.FC = () => {
  const { data: stats } = useStats();
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard();

  const totalChallenges = stats?.total_challenges ?? 0;
  const totalSolutions = stats?.total_solutions ?? 0;
  const resolvedCount = stats?.resolved_count ?? 0;
  const activeUsers = stats?.active_users ?? 0;
  const proposalsPerChallenge =
    totalChallenges > 0 ? (totalSolutions / totalChallenges).toFixed(1) : '0.0';
  const resolutionRate =
    totalChallenges > 0 ? Math.round((resolvedCount / totalChallenges) * 100) : 0;

  // Fallback demo chart data if server has sparse stats
  const categoryData =
    stats?.top_categories && stats.top_categories.length > 0
      ? stats.top_categories
      : [
          { name: 'Infrastructure', count: 42 },
          { name: 'Environment', count: 35 },
          { name: 'Safety', count: 28 },
          { name: 'Education', count: 19 },
          { name: 'Healthcare', count: 14 },
          { name: 'Transportation', count: 22 },
        ];

  const timelineData =
    stats?.resolved_over_time && stats.resolved_over_time.length > 0
      ? stats.resolved_over_time
      : [
          { month: 'Jun', resolved: 4, challenges: 12 },
          { month: 'Jul', resolved: 8, challenges: 19 },
          { month: 'Aug', resolved: 14, challenges: 25 },
          { month: 'Sep', resolved: 22, challenges: 34 },
          { month: 'Oct', resolved: 31, challenges: 48 },
          { month: 'Nov', resolved: 45, challenges: 62 },
        ];

  return (
    <div className="container max-w-7xl py-10 px-4 space-y-10">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <TrendingUp className="h-4 w-4" />
          <span>Real-time Civic Insights</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Platform Impact Dashboard
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Tracking how crowdsourced community challenges turn into concrete solutions and verified civic progress.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Challenges</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            <ImpactCounter value={totalChallenges} />
          </p>
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            Community-submitted issues
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Solutions Proposed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            <ImpactCounter value={totalSolutions} />
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            {proposalsPerChallenge} proposals / challenge
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Issues Resolved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            <ImpactCounter value={resolvedCount} />
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            {resolutionRate}% resolution rate
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Citizens</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            <ImpactCounter value={activeUsers} />
          </p>
          <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
            Registered civic contributors
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Challenges by Category</h3>
            <p className="text-xs text-muted-foreground">Distribution of problems reported across civic sectors</p>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Timeline */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Resolution Growth Over Time</h3>
            <p className="text-xs text-muted-foreground">New challenges versus verified resolved issues</p>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="challenges"
                  name="Posted"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span>Civic Leaderboard</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Top community champions recognized for verified solutions and contributions
            </p>
          </div>
        </div>

        {leaderboardLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Contributor</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">Reputation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {(leaderboard.length > 0
                  ? leaderboard
                  : [
                      { id: 1, username: 'elena_urban', location: 'Downtown', reputation: 420 },
                      { id: 2, username: 'marcus_builds', location: 'East Ward', reputation: 385 },
                      { id: 3, username: 'priya_green', location: 'River Valley', reputation: 310 },
                      { id: 4, username: 'david_solar', location: 'Tech Corridor', reputation: 240 },
                    ]
                ).map((user, idx) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-xs text-muted-foreground">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-3">
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                            {user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1 font-semibold text-foreground group-hover:text-primary group-hover:underline transition-colors">
                            <span>{user.username}</span>
                            {user.reputation >= 50 && (
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">
                      {user.location || 'Civic Participant'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-primary text-sm">
                      {user.reputation} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
