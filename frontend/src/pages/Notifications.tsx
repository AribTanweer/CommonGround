import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useNotifications, useMarkRead } from '@/api/notifications';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/utils';

export const Notifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data: notifications = [], isLoading, isError } = useNotifications(isAuthenticated);
  const markReadMutation = useMarkRead();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <Bell className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Sign In Required</h2>
        <p className="text-sm text-muted-foreground">
          You must be signed in to view your notifications.
        </p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const filtered =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAll = () => {
    markReadMutation.mutate({});
  };

  const handleItemClick = (id: number) => {
    markReadMutation.mutate({ id });
  };

  return (
    <div className="container max-w-3xl py-10 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay informed on solution proposals, votes, and updates to challenges you follow.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markReadMutation.isPending}
            className="gap-1.5 rounded-xl text-xs"
          >
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="rounded-xl text-xs h-8"
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="rounded-xl text-xs h-8"
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center border rounded-2xl bg-destructive/5 space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm font-semibold">Failed to load notifications</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center space-y-3 bg-muted/20">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-base text-foreground">No notifications</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You are all caught up! New responses, supports, and updates will appear here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                !item.is_read
                  ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/80 bg-card hover:bg-muted/40'
              }`}
            >
              <Avatar className="h-9 w-9 mt-0.5 ring-1 ring-border shrink-0">
                <AvatarImage src={item.actor?.avatar || undefined} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {item.actor?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.actor?.username || 'Community Member'}
                  </p>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {timeAgo(item.created_at)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.verb}{' '}
                  {item.challenge && (
                    <Link
                      to={`/challenges/${item.challenge.id}`}
                      className="text-foreground font-semibold hover:underline"
                    >
                      "{item.challenge.title}"
                    </Link>
                  )}
                </p>
              </div>

              {!item.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
