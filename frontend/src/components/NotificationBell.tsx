import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Sparkles } from 'lucide-react';
import { useNotifications, useMarkRead } from '@/api/notifications';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications(isAuthenticated);
  const markReadMutation = useMarkRead();

  if (!isAuthenticated) return null;

  const unreadList = notifications.filter((n) => !n.is_read);
  const unreadCount = unreadList.length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markReadMutation.mutate({});
  };

  const handleItemClick = (id: number, isRead: boolean, challengeId?: number) => {
    if (!isRead) {
      markReadMutation.mutate({ ids: [id] });
    }
    if (challengeId) {
      navigate(`/challenges/${challengeId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 font-bold text-sm text-foreground">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-72 overflow-y-auto space-y-1 py-1">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onClick={() => handleItemClick(notif.id, notif.is_read, notif.challenge?.id)}
                className={`p-2.5 rounded-lg flex flex-col items-start gap-1 cursor-pointer transition-colors ${
                  !notif.is_read ? 'bg-primary/5 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="font-semibold text-foreground">
                    {notif.actor?.username || 'Community'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notif.verb}{' '}
                  {notif.challenge && (
                    <span className="text-foreground font-semibold">
                      "{notif.challenge.title}"
                    </span>
                  )}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="pt-1 text-center">
          <Link
            to="/notifications"
            className="block w-full py-1.5 text-xs text-center font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
