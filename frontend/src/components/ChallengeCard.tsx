import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MapPin, MessageSquare, Lightbulb, ShieldCheck } from 'lucide-react';
import { Challenge } from '@/api/types';
import { STATUS_CONFIG } from '@/lib/constants';
import { timeAgo, truncate } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useSupportChallenge } from '@/api/challenges';
import { useAuth } from '@/context/AuthContext';

interface ChallengeCardProps {
  challenge: Challenge;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const { user, isAuthenticated } = useAuth();
  const supportMutation = useSupportChallenge(challenge.id);

  const statusInfo = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.open;
  const isAuthor = user?.id === challenge.author?.id;
  const authorName = challenge.author?.username || challenge.author_username || 'Anonymous';
  const categoryName = challenge.category?.name || challenge.category_name || 'General';
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

  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className="group block relative rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between"
    >
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="outline"
            className="font-medium text-xs bg-muted/40 border-border/60 text-foreground"
          >
            {categoryName}
          </Badge>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusInfo.label}
          </span>
        </div>

        {/* Thumbnail Image if exists */}
        {challenge.image && (
          <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-muted">
            <img
              src={challenge.image}
              alt={challenge.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
          {challenge.title}
        </h3>

        {/* Description snippet */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
          {challenge.description}
        </p>
      </div>

      <div>
        {/* Tags */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {challenge.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[11px] font-medium bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
            <span className="truncate">{truncate(challenge.location, 35)}</span>
          </div>
        )}

        {/* Footer info & Support Action */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
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
              title={isAuthor ? "You cannot support your own challenge" : "Support this challenge"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isSupported
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'bg-muted/80 text-foreground hover:bg-primary/10 hover:text-primary'
              } ${isAuthor ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${isSupported ? 'fill-current' : ''}`}
              />
              <span>{challenge.support_count}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
