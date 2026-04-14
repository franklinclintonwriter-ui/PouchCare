import { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/utils/format';

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  className?: string;
}

function CommentThread({
  comments,
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment...',
  className,
}: CommentThreadProps) {
  const [content, setContent] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Comment list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar name={comment.authorName} src={comment.authorAvatar} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {comment.authorName}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatRelative(comment.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
            No comments yet
          </p>
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'block w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all',
              'placeholder:text-gray-400',
              'focus:border-primary-300 focus:ring-2 focus:ring-primary-500/10 focus:outline-none',
              'dark:border-gray-600/80 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim()}
          isLoading={isSubmitting}
          icon={<Send />}
        >
          Send
        </Button>
      </form>
    </div>
  );
}

export { CommentThread };
