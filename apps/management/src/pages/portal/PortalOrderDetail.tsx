import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePortalOrder, usePortalOrderMessages, useSendPortalOrderMessage } from '@/api/portal';
import { useCurrency } from '@/hooks/useCurrency';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';

export default function PortalOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  const { data: order, isLoading } = usePortalOrder(id!);
  const { data: messages = [], isLoading: messagesLoading } = usePortalOrderMessages(id!);
  const sendMessage = useSendPortalOrderMessage();
  const [tab, setTab] = useState('details');
  const [message, setMessage] = useState('');

  useHeaderConfig({
    title: order?.number ?? 'Order',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Orders', href: '/portal/orders' },
      { label: order?.number ?? '...' },
    ],
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <Card>
          <p className="text-sm text-gray-500">Order not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Timeline */}
        <Card>
          <OrderTimeline currentStatus={order.status} />
        </Card>

        {/* Info Card */}
        <Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Service" value={order.serviceName} />
            <InfoItem label="Amount" value={formatCurrency(order.amount)} />
            <InfoItem label="Status">
              <StatusBadge status={order.status} />
            </InfoItem>
            <InfoItem label="Placed" value={order.placedDate} />
            <InfoItem label="Delivery" value={order.deliveryDate ?? 'Pending'} />
            <InfoItem label="Assigned Shoulder" value={order.assignedStaff ?? 'Unassigned'} />
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Details', value: 'details' },
            { label: 'Messages', value: 'messages' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(order.specifications).length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                  {Object.entries(order.specifications).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{key}</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[60%] truncate text-right">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No specifications provided.</p>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'messages' && (
          <Card>
            <CardContent className="mt-0 space-y-4">
              {messagesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-2/3 rounded-xl" />
                  <Skeleton className="h-12 w-1/2 rounded-xl" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                  <MessageSquare className="h-8 w-8" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start conversation with support for this order.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.authorType === 'member' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[80%] items-start gap-2.5 ${m.authorType === 'member' ? 'flex-row-reverse' : ''}`}>
                        <Avatar name={m.authorName} size="sm" />
                        <div>
                          <div className={`rounded-2xl px-3 py-2 text-sm ${m.authorType === 'member' ? 'rounded-tr-sm bg-primary-600 text-white' : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'}`}>
                            {m.content}
                          </div>
                          <p className={`mt-1 text-[10px] text-gray-400 ${m.authorType === 'member' ? 'text-right' : ''}`}>
                            {m.authorName} - {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message..."
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    isLoading={sendMessage.isPending}
                    onClick={async () => {
                      const content = message.trim();
                      if (!content) return;
                      try {
                        await sendMessage.mutateAsync({ orderId: order.id, content });
                        setMessage('');
                        toast.success('Message sent');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to send message');
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      {children ?? <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>}
    </div>
  );
}
