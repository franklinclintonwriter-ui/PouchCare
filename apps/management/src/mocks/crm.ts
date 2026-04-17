import type { Lead, SalesOrder } from '@/types/models';
import type { LeadStage, PaymentStatus } from '@/types/enums';
import { fakeId, fakeName, fakeEmail, fakePhone, randomFrom, randomInt, fakeDateRecent, fakeDatePast, companies, sources } from './generators';
import { mockStaff } from './staff';

const stages: LeadStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export const mockLeads: Lead[] = Array.from({ length: 28 }, () => {
  const name = fakeName();
  const assignee = randomFrom(mockStaff);
  return {
    id: fakeId(), name, email: fakeEmail(name), company: randomFrom(companies),
    phone: fakePhone(), stage: randomFrom(stages), value: randomInt(1, 50) * 1000,
    assigneeId: assignee.id, assigneeName: assignee.name, assigneeAvatar: assignee.avatarUrl,
    source: randomFrom(sources), lastContactDate: fakeDateRecent(20),
    notes: 'Follow up scheduled.', createdAt: fakeDatePast(3),
  };
});

const payStatuses: PaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'];
export const mockSalesOrders: SalesOrder[] = Array.from({ length: 18 }, (_, i) => ({
  id: fakeId(), number: `SO-${String(2000 + i).padStart(4, '0')}`,
  clientName: randomFrom(companies),
  items: Array.from({ length: randomInt(1, 3) }, () => ({
    name: randomFrom(['SEO Package', 'Web Dev', 'Content Plan', 'Ad Campaign']),
    qty: randomInt(1, 5), price: randomInt(200, 3000),
  })),
  total: randomInt(1000, 25000), status: randomFrom(payStatuses),
  date: fakeDateRecent(45), assigneeName: randomFrom(mockStaff).name,
}));
