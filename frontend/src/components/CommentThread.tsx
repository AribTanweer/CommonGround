import React, { useState } from 'react';
import { CornerDownRight, Trash2, Send, Flag } from 'lucide-react';
import { Comment } from '@/api/types';
import { timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ConfirmDialog } from './ui/confirm-dialog';
import { ReportDialog } from './ReportDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCreateComment, useDeleteComment } from '@/api/engagement';

interface CommentThreadProps {
  comments: Comment[];
  challengeId?: number | string;
  solutionId?: number | string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  challengeId,
  solutionId,
}) => {
  const { isAuthenticated } = useAuth();
  const [rootBody, setRootBody] = useState('');
  const createCommentMutation = useCreateComment({ challengeId, solutionId });

  const handlePostRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootBody.trim()) return;
    createCommentMutation.mutate(
      { body: rootBody.trim() },
      {
        onSuccess: () => setRootBody(''),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Root Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handlePostRoot} className="space-y-3">
          <Textarea
            placeholder="Add to the community discussion..."
            value={rootBody}
            onChange={(e) => setRootBody(e.target.value)}
            rows={3}
            className="w-full resize-none text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!rootBody.trim() || createCommentMutation.isPending}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Comment</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl border border-dashed text-center text-sm text-muted-foreground bg-muted/20">
          <a href="/login" className="text-primary font-semibold hover:underline">
            Log in
          </a>{' '}
          to join the conversation and contribute.
        </div>
      )}

      {/* List of comments */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No discussion yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              challengeId={challengeId}
              solutionId={solutionId}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  challengeId?: number | string;
  solutionId?: number | string;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  challengeId,
  solutionId,
  depth = 0,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const createCommentMutation = useCreateComment({ challengeId, solutionId });
  const deleteCommentMutation = useDeleteComment({ challengeId, solutionId });

  const isAuthor = user?.id === comment.author?.id;

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    createCommentMutation.mutate(
      { body: replyBody.trim(), parent: comment.id },
      {
        onSuccess: () => {
          setReplyBody('');
          setIsReplying(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteCommentMutation.mutate(comment.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast({ title: 'Comment deleted', variant: 'default' });
      },
    });
  };

  return (
    <div
      className={`relative group ${
        depth > 0 ? 'ml-6 pl-4 border-l-2 border-border/60 mt-3' : ''
      }`}
    >
      <div className="rounded-xl p-3.5 bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={comment.author?.avatar || undefined} />
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {comment.author?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-foreground">
              {comment.author?.username || 'Community Member'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              • {timeAgo(comment.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAuthenticated && !isAuthor && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Report comment"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
            {isAuthor && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-2">
          {comment.body}
        </p>

        {isAuthenticated && depth < 3 && (
          <button
            type="button"
            onClick={() => setIsReplying(!isReplying)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <CornerDownRight className="h-3 w-3" />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-2 ml-4 space-y-2">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Reply to ${comment.author?.username}...`}
            rows={2}
            className="text-xs resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setIsReplying(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-7"
              disabled={!replyBody.trim() || createCommentMutation.isPending}
            >
              Post Reply
            </Button>
          </div>
        </form>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              challengeId={challengeId}
              solutionId={solutionId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete comment?"
        description="This will permanently remove your comment from the discussion."
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteCommentMutation.isPending}
        onConfirm={handleDelete}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="comment"
        targetId={comment.id}
      />
    </div>
  );
};
