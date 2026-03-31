import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useReplyToTicket, useTicket } from '@/api/support';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: ticket, isLoading } = useTicket(id ?? '');
  const replyMutation = useReplyToTicket();
  const [reply, setReply] = useState('');
  const isPortalPath = location.pathname.startsWith('/portal/');

  const headerConfig = useMemo(() => ({
    title: ticket ? `Ticket ${ticket.number}` : 'Ticket Detail',
    breadcrumbs: isPortalPath
      ? [
          { label: 'Dashboard', href: '/portal' },
          { label: 'Support', href: '/portal/support' },
          { label: ticket?.number ?? '...', icon: LifeBuoy },
        ]
      : [
          { label: 'Support', href: '/support' },
          { label: ticket?.number ?? '...', icon: LifeBuoy },
        ],
    actions: [],
  }), [ticket, isPortalPath]);
  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition className="space-y-4">
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-3/4 rounded-xl" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (!ticket) {
    return (
      <PageTransition>
        <Card>
          <p className="text-center text-sm text-gray-500">Ticket not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            <Badge variant="default">{ticket.category}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Client: <strong className="text-gray-700 dark:text-gray-300">{ticket.clientName}</strong></span>
            {ticket.assigneeName && (
              <span>Assigned: <strong className="text-gray-700 dark:text-gray-300">{ticket.assigneeName}</strong></span>
            )}
            <span>Created: {ticket.createdAt}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isStaff ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] items-start gap-2.5 ${
                msg.isStaff ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar name={msg.authorName} src={msg.authorAvatar} size="sm" />
              <div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.isStaff
                      ? 'rounded-tr-sm bg-primary-600 text-white'
                      : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className={`mt-1 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 ${
                    msg.isStaff ? 'justify-end' : ''
                  }`}
                >
                  <span>{msg.authorName}</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              isLoading={replyMutation.isPending}
              onClick={async () => {
                const content = reply.trim();
                if (!content) {
                  toast.error('Reply message is required');
                  return;
                }
                try {
                  await replyMutation.mutateAsync({ ticketId: ticket.id, content });
                  setReply('');
                  toast.success('Reply sent');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to send reply');
                }
              }}
            >
              Send Reply
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
