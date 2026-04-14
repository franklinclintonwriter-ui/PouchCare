import type { Ticket, TicketMessage, Broadcast, AppNotification } from '@/types/models';
import type { Priority } from '@/types/enums';
import { fakeId, fakeName, randomFrom, randomInt, fakeDateRecent, fakeDateFuture } from './generators';
import { mockStaff } from './staff';

const priorities: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ticketStatuses: ('open' | 'in_progress' | 'waiting' | 'resolved' | 'closed')[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const ticketCategories = ['Technical', 'Billing', 'Account', 'Service', 'General'];

const ticketSubjects = [
  'Cannot access my account', 'Payment not received', 'Order delivery delayed',
  'Website is showing errors', 'Need to upgrade my plan', 'Refund request',
  'How to use referral system?', 'SSL certificate issue', 'API integration help',
  'Custom development request', 'Performance issues', 'Feature request',
  'Billing discrepancy', 'Account verification pending', 'Service not as described',
  'Need urgent support', 'Domain transfer help', 'Server downtime report',
  'Mobile app not working', 'Data export request',
];

function fakeMessages(count: number): TicketMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: fakeId(),
    content: randomFrom([
      'I need help with this issue urgently.',
      'Thanks for reaching out. Let me look into this.',
      'Could you provide more details?',
      'I have attached the screenshot.',
      'This has been resolved. Please check now.',
      'Still experiencing the issue.',
      'We are working on a fix. Will update shortly.',
    ]),
    authorName: i % 2 === 0 ? fakeName() : randomFrom(mockStaff).name,
    isStaff: i % 2 !== 0,
    createdAt: new Date(Date.now() - (count - i) * 3600000).toISOString(),
  }));
}

export const mockTickets: Ticket[] = Array.from({ length: 22 }, (_, i) => {
  const assignee = Math.random() > 0.3 ? randomFrom(mockStaff) : undefined;
  return {
    id: fakeId(), number: `TK-${String(3000 + i).padStart(4, '0')}`,
    subject: ticketSubjects[i % ticketSubjects.length],
    clientName: fakeName(), clientEmail: `client${i}@example.com`,
    priority: randomFrom(priorities), status: randomFrom(ticketStatuses),
    assigneeId: assignee?.id, assigneeName: assignee?.name,
    category: randomFrom(ticketCategories),
    messages: fakeMessages(randomInt(2, 6)),
    createdAt: fakeDateRecent(30),
    lastReplyAt: fakeDateRecent(5),
  };
});

export const mockBroadcasts: Broadcast[] = [
  { id: fakeId(), title: 'New Year Sale - 50% Off', message: 'Enjoy our new year special...', sentBy: 'Admin', audience: 'all', channel: 'email', isUrgent: false, createdAt: fakeDateRecent(5) },
  { id: fakeId(), title: 'Service Update Notice', message: 'Important update about...', sentBy: 'Admin', audience: 'clients', channel: 'email', isUrgent: false, createdAt: fakeDateRecent(10) },
  { id: fakeId(), title: 'Flash Deal Alert', message: 'Limited time offer...', sentBy: 'Admin', audience: 'all', channel: 'in_app', isUrgent: true, createdAt: fakeDateFuture(3) },
  { id: fakeId(), title: 'Maintenance Window', message: 'Scheduled maintenance...', sentBy: 'Ops', audience: 'staff', channel: 'email', isUrgent: true, createdAt: fakeDateRecent(2) },
  { id: fakeId(), title: 'Referral Program Launch', message: 'Introducing our referral...', sentBy: 'Marketing', audience: 'clients', channel: 'in_app', isUrgent: false, createdAt: fakeDateRecent(20) },
  { id: fakeId(), title: 'Monthly Newsletter', message: 'This month highlights...', sentBy: 'Admin', audience: 'all', channel: 'email', isUrgent: false, createdAt: fakeDateRecent(15) },
];

const notifTypes: AppNotification['type'][] = ['task', 'leave', 'ticket', 'payment', 'system', 'order'];
export const mockNotifications: AppNotification[] = Array.from({ length: 20 }, (_, i) => {
  const type = randomFrom(notifTypes);
  const titles: Record<AppNotification['type'], string[]> = {
    task: ['Task assigned to you', 'Task status updated', 'Task overdue reminder'],
    leave: ['Leave request submitted', 'Leave approved', 'Leave rejected'],
    ticket: ['New support ticket', 'Ticket reply received', 'Ticket resolved'],
    payment: ['Invoice paid', 'Payment overdue', 'Payout processed'],
    system: ['System maintenance', 'New feature available', 'Security alert'],
    order: ['New order placed', 'Order status updated', 'Order delivered'],
  };
  return {
    id: fakeId(), type, title: randomFrom(titles[type]),
    description: `Notification details for ${type} event.`,
    timestamp: new Date(Date.now() - i * randomInt(1, 12) * 3600000).toISOString(),
    read: i > 5 ? Math.random() > 0.4 : false,
    resourceUrl: `/${type === 'task' ? 'tasks' : type === 'ticket' ? 'support' : type === 'order' ? 'portal/orders' : '#'}`,
  };
});
