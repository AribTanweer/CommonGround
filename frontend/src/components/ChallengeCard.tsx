import React from 'react';
import { Link } from 'react-router-dom';
import {
  ThumbsUp,
  MapPin,
  MessageSquare,
  Lightbulb,
  ShieldCheck,
  Building2,
  Leaf,
  GraduationCap,
  HeartPulse,
  ShieldAlert,
  Cpu,
  Bus,
  Users,
  Compass,
} from 'lucide-react';
import { Challenge } from '@/api/types';
import { STATUS_CONFIG, STATUS_STEPS, getCategoryColor } from '@/lib/constants';
import { timeAgo, truncate } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useSupportChallenge } from '@/api/challenges';
import { useAuth } from '@/context/AuthContext';

interface ChallengeCardProps {
  challenge: Challenge;
  variant?: 'grid' | 'list';
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  infrastructure: Building2,
  environment: Leaf,
  education: GraduationCap,
  healthcare: HeartPulse,
  safety: ShieldAlert,
  technology: Cpu,
  transportation: Bus,
  community: Users,
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, variant = 'grid' }) => {
  const { user, isAuthenticated } = useAuth();
  const supportMutation = useSupportChallenge(challenge.id);

  const statusInfo = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.open;
  const isAuthor = user?.id === challenge.author?.id;
  const authorName = challenge.author?.username || challenge.author_username || 'Anonymous';
  const categoryName = challenge.category?.name || challenge.category_name || 'General';
  const categorySlug = challenge.category?.slug || categoryName.toLowerCase();
  const categoryColor = getCategoryColor(categorySlug);
  const CategoryIcon = CATEGORY_ICONS[categorySlug] || Compass;
  const isSupported = !!(challenge.has_supported ?? challenge.is_supported);

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (isAuthor) return;
    supportMutation.mutate({ isSupported });
  };

  if (variant === 'list') {
    return (
      <article
        className="group flex flex-col justify-between gap-4 border-b border-border/80 py-5 transition-colors hover:bg-card/55 sm:flex-row sm:items-center sm:gap-8 sm:px-3"
      >
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-secondary text-primary sm:flex"
          >
            <CategoryIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`font-semibold text-[11px] gap-1 ${categoryColor}`}>
                <CategoryIcon className="h-3 w-3" />
                {categoryName}
              </Badge>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusInfo.label}
              </span>
              {challenge.location && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {truncate(challenge.location, 28)}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-foreground transition-colors line-clamp-1">
              <Link to={`/challenges/${challenge.id}`} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {challenge.title}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{challenge.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{authorName}</span>
            <span>• {timeAgo(challenge.created_at)}</span>
            {challenge.solutions_count !== undefined && (
              <span className="inline-flex items-center gap-1" title="Solutions proposed">
                <Lightbulb className="h-3.5 w-3.5" />
                {challenge.solutions_count}
              </span>
            )}
            {challenge.comments_count !== undefined && (
              <span className="inline-flex items-center gap-1" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" />
                {challenge.comments_count}
              </span>
            )}
          </div>

          <button
            onClick={handleSupportClick}
            disabled={isAuthor || supportMutation.isPending}
            title={isAuthor ? 'You cannot support your own challenge' : 'Support this challenge'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              isSupported
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-muted/80 text-foreground hover:bg-primary/10 hover:text-primary'
            } ${isAuthor ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isSupported ? 'fill-current' : ''}`} />
            <span>{challenge.support_count}</span>
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className="paper-panel group relative flex flex-col justify-between overflow-hidden rounded-[1.15rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-34px_hsl(var(--foreground)/0.5)]"
    >
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 px-5 pt-5">
          <Badge variant="outline" className={`gap-1.5 border-transparent bg-secondary font-semibold text-[10px] uppercase tracking-wider text-secondary-foreground ${categoryColor}`}>
            <CategoryIcon className="h-3 w-3" />
            {categoryName}
          </Badge>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusInfo.label}
          </span>
        </div>

        {/* Thumbnail Image or Clean Category Banner */}
        {challenge.image ? (
          <div className="relative mx-5 mt-4 h-36 overflow-hidden rounded-lg bg-muted">
            <img
              src={challenge.image}
              alt={challenge.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="relative mx-5 mt-4 flex h-32 items-center justify-between overflow-hidden rounded-lg border border-primary/10 bg-secondary px-5"
          >
            <div className="flex items-center gap-3 text-primary">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div><span className="eyebrow block">A community note</span><span className="mt-1 block font-display text-xl">{categoryName}</span></div>
            </div>
            <div className="pointer-events-none absolute -right-5 -top-8 h-36 w-36 rounded-full border border-primary/15" />
            <div className="pointer-events-none absolute -right-1 -top-4 h-24 w-24 rounded-full border border-primary/15" />
          </div>
        )}

        {/* Title */}
        <h3 className="px-5 pt-4 text-[1.45rem] font-normal leading-tight text-foreground transition-colors line-clamp-2">
          <Link to={`/challenges/${challenge.id}`} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {challenge.title}
          </Link>
        </h3>

        {/* Description snippet */}
        <p className="px-5 pt-2 text-[13px] leading-6 text-muted-foreground line-clamp-2">
          {challenge.description}
        </p>
      </div>

      <div>
        {/* Tags */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-4">
            {challenge.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
            {challenge.tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{challenge.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location if present */}
        {challenge.location && (
          <div className="flex items-center gap-1.5 px-5 pt-4 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="truncate">{truncate(challenge.location, 35)}</span>
          </div>
        )}

        {/* Subtle Lifecycle Progress Strip */}
        {statusInfo.stepIndex >= 0 && (
          <div className="mx-5 mt-4 grid grid-cols-4 gap-1" title={`Stage: ${statusInfo.label}`}>
            {STATUS_STEPS.map((step, idx) => (
              <div
                key={step.key}
                className={`h-1 rounded-full transition-colors ${
                  idx <= statusInfo.stepIndex ? 'bg-primary/70' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}

        {/* Footer info & Support Action */}
        <div className="mx-5 mt-4 flex items-center justify-between gap-2 border-t border-border/70 py-4">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 ring-1 ring-border">
              <AvatarImage src={challenge.author?.avatar || undefined} />
              <AvatarFallback className="text-[11px] uppercase font-bold bg-primary/10 text-primary">
                {authorName[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                  {authorName}
                </span>
                {challenge.author?.reputation !== undefined && challenge.author.reputation > 50 && (
                  <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {timeAgo(challenge.created_at)}
              </span>
            </div>
          </div>

          {/* Stats & Support CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {challenge.solutions_count !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Solutions proposed">
                <Lightbulb className="h-3.5 w-3.5" />
                {challenge.solutions_count}
              </span>
            )}

            {challenge.comments_count !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" />
                {challenge.comments_count}
              </span>
            )}

            <button
              onClick={handleSupportClick}
              disabled={isAuthor || supportMutation.isPending}
              title={isAuthor ? 'You cannot support your own challenge' : 'Support this challenge'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isSupported
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'bg-muted/80 text-foreground hover:bg-primary/10 hover:text-primary'
              } ${isAuthor ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${isSupported ? 'fill-current' : ''}`} />
              <span>{challenge.support_count}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
