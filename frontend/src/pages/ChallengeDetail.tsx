import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  Bookmark,
  MapPin,
  Calendar,
  Share2,
  PlusCircle,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { useChallenge, useSupportChallenge, useFollowChallenge, useUpdateChallengeStatus } from '@/api/challenges';
import { useSolutions } from '@/api/solutions';
import { useComments } from '@/api/engagement';
import { useAuth } from '@/context/AuthContext';
import { StatusStepper } from '@/components/StatusStepper';
import { SolutionCard } from '@/components/SolutionCard';
import { CommentThread } from '@/components/CommentThread';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, timeAgo } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProposeSolutionForm } from './ProposeSolution';

export const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [proposeOpen, setProposeOpen] = useState(false);

  const { data: challenge, isLoading, isError } = useChallenge(id);
  const { data: solutions = [], isLoading: solutionsLoading } = useSolutions(challenge?.id);
  const { data: comments = [], isLoading: commentsLoading } = useComments({ challengeId: challenge?.id });

  const supportMutation = useSupportChallenge(challenge?.id || 0);
  const followMutation = useFollowChallenge(challenge?.id || 0);
  const statusMutation = useUpdateChallengeStatus(challenge?.id || 0);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Challenge Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The challenge you are looking for does not exist or has been removed.
        </p>
        <Link to="/explore">
          <Button variant="default">Back to Explore</Button>
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === challenge.author?.id;
  const authorName = challenge.author?.username || challenge.author_username || 'Anonymous';
  const categoryName = challenge.category?.name || challenge.category_name || 'General';
  const isSupported = !!(challenge.has_supported ?? challenge.is_supported);
  const statusInfo = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.open;

  const handleSupport = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (isAuthor) return;
    supportMutation.mutate({ isSupported });
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    followMutation.mutate({ isFollowing: !!challenge.is_following });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: challenge.description.slice(0, 100),
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">
            {categoryName}
          </Badge>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusInfo.label}
          </span>
          {challenge.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {challenge.location}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {challenge.title}
        </h1>

        {/* Author bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-border/70">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-border">
              <AvatarImage src={challenge.author?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {authorName[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/profile/${authorName}`}
                  className="font-semibold text-sm hover:underline text-foreground"
                >
                  {authorName}
                </Link>
                {challenge.author?.reputation !== undefined && challenge.author.reputation > 50 && (
                  <span title="High reputation contributor">
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(challenge.created_at)} ({timeAgo(challenge.created_at)})
                </span>
                <span>•</span>
                <span>Reputation: {challenge.author?.reputation ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFollow}
              disabled={followMutation.isPending}
              className={`gap-1.5 rounded-xl text-xs ${
                challenge.is_following ? 'bg-primary/10 text-primary border-primary/30' : ''
              }`}
            >
              <Bookmark className={`h-4 w-4 ${challenge.is_following ? 'fill-current' : ''}`} />
              <span>{challenge.is_following ? 'Following' : 'Follow'}</span>
            </Button>

            <Button
              variant={isSupported ? 'default' : 'outline'}
              size="sm"
              onClick={handleSupport}
              disabled={isAuthor || supportMutation.isPending}
              title={isAuthor ? 'You cannot support your own challenge' : 'Support this challenge'}
              className={`gap-2 rounded-xl text-xs font-semibold ${
                isSupported ? 'shadow-sm' : ''
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${isSupported ? 'fill-current' : ''}`} />
              <span>Support ({challenge.support_count})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lifecycle Status Stepper */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Progress Lifecycle
          </h3>
          {/* Owner status modifier if owner */}
          {isAuthor && challenge.status !== 'closed' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Set status:</span>
              <select
                value={challenge.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                className="text-xs rounded-lg border bg-background px-2 py-1 font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="open">Open</option>
                <option value="proposed">Proposed</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>
        <StatusStepper status={challenge.status} />
      </div>

      {/* Challenge Image if exists */}
      {challenge.image && (
        <div className="w-full max-h-[450px] overflow-hidden rounded-2xl border bg-muted shadow-sm">
          <img
            src={challenge.image}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Challenge Description */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-foreground">Challenge Overview</h2>
        <div className="text-base text-foreground/90 whitespace-pre-line leading-relaxed">
          {challenge.description}
        </div>

        {/* Tags */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
            {challenge.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs font-medium">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs: Solutions vs Discussion */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
        <Tabs defaultValue="solutions" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
            <TabsList className="grid grid-cols-2 w-full sm:w-80">
              <TabsTrigger value="solutions" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Solutions ({solutions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="discussion" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Discussion ({comments.length})</span>
              </TabsTrigger>
            </TabsList>

            <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="cta" className="gap-1.5 rounded-xl shadow-sm">
                  <PlusCircle className="h-4 w-4" />
                  <span>Propose Solution</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Propose a Solution</DialogTitle>
                </DialogHeader>
                <ProposeSolutionForm
                  challengeId={challenge.id}
                  onSuccess={() => setProposeOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Solutions Content */}
          <TabsContent value="solutions" className="space-y-4 pt-2">
            {solutionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : solutions.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mx-auto">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-base text-foreground">
                  No solutions proposed yet
                </h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Have an idea or action plan to solve this issue? Be the first to submit a proposal!
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setProposeOpen(true)}
                  className="gap-2 mt-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Submit First Proposal</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {solutions.map((sol) => (
                  <SolutionCard
                    key={sol.id}
                    solution={sol}
                    challengeOwnerId={challenge.author?.id}
                    challengeId={challenge.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discussion Content */}
          <TabsContent value="discussion" className="pt-2">
            {commentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <CommentThread comments={comments} challengeId={challenge.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
