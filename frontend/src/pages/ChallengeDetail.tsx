import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  useChallenge,
  useSupportChallenge,
  useFollowChallenge,
  useUpdateChallengeStatus,
  useUpdateChallenge,
  useDeleteChallenge,
} from '@/api/challenges';
import { useSolutions } from '@/api/solutions';
import { useComments } from '@/api/engagement';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { StatusStepper } from '@/components/StatusStepper';
import { SolutionCard } from '@/components/SolutionCard';
import { CommentThread } from '@/components/CommentThread';
import { ReportDialog } from '@/components/ReportDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, timeAgo } from '@/lib/utils';
import { STATUS_CONFIG, getCategoryColor } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProposeSolutionForm } from './ProposeSolution';

export const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const { data: challenge, isLoading, isError } = useChallenge(id);
  const { data: solutions = [], isLoading: solutionsLoading } = useSolutions(challenge?.id);
  const { data: comments = [], isLoading: commentsLoading } = useComments({
    challengeId: challenge?.id,
  });

  const supportMutation = useSupportChallenge(challenge?.id || 0);
  const followMutation = useFollowChallenge(challenge?.id || 0);
  const statusMutation = useUpdateChallengeStatus(challenge?.id || 0);
  const updateChallengeMutation = useUpdateChallenge(challenge?.id || 0);
  const deleteChallengeMutation = useDeleteChallenge(challenge?.id || 0);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-10 px-4 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
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
  const categorySlug = challenge.category?.slug || categoryName.toLowerCase();
  const categoryColor = getCategoryColor(categorySlug);
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
    followMutation.mutate(
      { isFollowing: !!challenge.is_following },
      {
        onSuccess: () => {
          toast({
            title: challenge.is_following ? 'Unfollowed challenge' : 'Following challenge',
            description: challenge.is_following
              ? 'You will no longer receive updates.'
              : 'You will be notified of new solutions and status changes.',
            variant: 'default',
          });
        },
      }
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: challenge.description.slice(0, 100),
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Challenge URL copied to your clipboard.',
      variant: 'success',
    });
  };

  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate(newStatus, {
      onSuccess: () => {
        toast({
          title: 'Status updated',
          description: `Challenge marked as ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}.`,
          variant: 'success',
        });
      },
    });
  };

  const handleOpenEdit = () => {
    setEditTitle(challenge.title);
    setEditDescription(challenge.description);
    setEditLocation(challenge.location || '');
    setEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) return;
    updateChallengeMutation.mutate(
      {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          toast({
            title: 'Challenge updated',
            description: 'Your changes have been saved.',
            variant: 'success',
          });
        },
        onError: () => {
          toast({
            title: 'Update failed',
            description: 'Could not save challenge changes.',
            variant: 'error',
          });
        },
      }
    );
  };

  const handleDeleteChallenge = () => {
    deleteChallengeMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        toast({
          title: 'Challenge deleted',
          description: 'The challenge has been removed.',
          variant: 'success',
        });
        navigate('/explore');
      },
      onError: () => {
        toast({
          title: 'Delete failed',
          description: 'Could not delete this challenge.',
          variant: 'error',
        });
      },
    });
  };

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthor && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>
          {isAuthenticated && !isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportOpen(true)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Report</span>
            </Button>
          )}
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Narrative, Solutions & Comments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`text-xs font-semibold ${categoryColor}`}>
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
            <div className="flex items-center gap-3 py-3 border-y border-border/70">
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
          </div>

          {/* Challenge Image if exists */}
          {challenge.image && (
            <div className="w-full max-h-[420px] overflow-hidden rounded-2xl border bg-muted shadow-sm">
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
                  <Link key={tag.id} to={`/explore?tag=${tag.slug}`}>
                    <Badge variant="secondary" className="text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                      #{tag.name}
                    </Badge>
                  </Link>
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
                    <Button
                      size="sm"
                      variant="cta"
                      disabled={challenge.status === 'closed'}
                      title={challenge.status === 'closed' ? 'This challenge is closed' : 'Propose a solution'}
                      className="gap-1.5 rounded-xl shadow-sm"
                    >
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

        {/* Sticky Right Summary Rail */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          {/* Primary CTAs Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Take Action
            </h3>

            <Button
              variant={isSupported ? 'default' : 'outline'}
              onClick={handleSupport}
              disabled={isAuthor || supportMutation.isPending}
              title={isAuthor ? 'You cannot support your own challenge' : 'Support this challenge'}
              className="w-full justify-between rounded-xl font-semibold"
            >
              <span className="flex items-center gap-2">
                <ThumbsUp className={`h-4 w-4 ${isSupported ? 'fill-current' : ''}`} />
                <span>{isSupported ? 'Supported' : 'Support Challenge'}</span>
              </span>
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                  isSupported
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {challenge.support_count}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={handleFollow}
              disabled={followMutation.isPending}
              className={`w-full justify-start gap-2 rounded-xl ${
                challenge.is_following ? 'bg-primary/10 text-primary border-primary/30' : ''
              }`}
            >
              <Bookmark className={`h-4 w-4 ${challenge.is_following ? 'fill-current' : ''}`} />
              <span>{challenge.is_following ? 'Following Updates' : 'Follow Challenge'}</span>
            </Button>

            <Button
              variant="cta"
              onClick={() => setProposeOpen(true)}
              disabled={challenge.status === 'closed'}
              title={challenge.status === 'closed' ? 'This challenge is closed' : 'Propose a solution'}
              className="w-full justify-start gap-2 rounded-xl shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Propose a Solution</span>
            </Button>
          </div>

          {/* Lifecycle Status Stepper Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Progress Lifecycle
              </h3>
              {isAuthor && challenge.status !== 'closed' && (
                <select
                  value={challenge.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  aria-label="Update challenge status"
                  className="text-xs rounded-lg border bg-background px-2 py-1 font-medium focus:ring-1 focus:ring-primary"
                >
                  <option value="open">Open</option>
                  <option value="proposed">Proposed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              )}
            </div>
            <StatusStepper status={challenge.status} orientation="vertical" />
          </div>

          {/* Quick Stats Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Challenge Details
            </h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-semibold text-foreground">{categoryName}</dd>
              </div>
              {challenge.location && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-semibold text-foreground text-right truncate max-w-[180px]">
                    {challenge.location}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Solutions Proposed</dt>
                <dd className="font-semibold text-foreground">{solutions.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Discussion Replies</dt>
                <dd className="font-semibold text-foreground">{comments.length}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="challenge"
        targetId={challenge.id}
      />

      {/* Edit Challenge Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-ch-title">Title</Label>
              <Input
                id="edit-ch-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-ch-desc">Description</Label>
              <Textarea
                id="edit-ch-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-ch-location">Location (Optional)</Label>
              <Input
                id="edit-ch-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Elm Street & 4th Ave"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateChallengeMutation.isPending}>
                {updateChallengeMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete this challenge?"
        description="This will permanently remove the challenge along with its proposals and discussion."
        confirmLabel="Delete Challenge"
        variant="destructive"
        isPending={deleteChallengeMutation.isPending}
        onConfirm={handleDeleteChallenge}
      />
    </div>
  );
};
