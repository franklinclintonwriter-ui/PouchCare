import type { Invoice, Expense, MonthlyRevenue } from '@/types/models';
import type { PaymentStatus, ApprovalStatus } from '@/types/enums';
import { fakeId, fakeName, fakeEmail, randomFrom, randomInt, fakeDateRecent, fakeDateFuture, companies, categories } from './generators';

const paymentStatuses: PaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED'];

export const mockInvoices: Invoice[] = Array.from({ length: 25 }, (_, i) => {
  const items = Array.from({ length: randomInt(1, 4) }, () => {
    const qty = randomInt(1, 10);
    const rate = randomInt(50, 500);
    return { description: randomFrom(['Web Development', 'SEO Service', 'Content Writing', 'Design Work', 'Consulting']), quantity: qty, rate, amount: qty * rate };
  });
  const subtotal = items.reduce((a, b) => a + b.amount, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const status = randomFrom(paymentStatuses);
  return {
    id: fakeId(), number: `INV-${String(1000 + i).padStart(4, '0')}`,
    clientName: randomFrom(companies), clientEmail: fakeEmail(randomFrom(companies)),
    items, subtotal, tax, total,
    paidAmount: status === 'PAID' ? total : status === 'PARTIAL' ? Math.round(total * 0.5) : 0,
    status, issueDate: fakeDateRecent(60), dueDate: fakeDateFuture(30),
  };
});

const approvalStatuses: ApprovalStatus[] = ['WAITING', 'SUBMITTED', 'APPROVED_MGR', 'REJECTED_MGR'];

export const mockExpenses: Expense[] = Array.from({ length: 20 }, () => ({
  id: fakeId(), description: randomFrom(['Office Supplies', 'Travel Expense', 'Software License', 'Team Lunch', 'Equipment', 'Internet Bill', 'Marketing Ad Spend']),
  category: randomFrom(categories), amount: randomInt(20, 5000),
  staffId: fakeId(), staffName: fakeName(), date: fakeDateRecent(45),
  receiptUrl: Math.random() > 0.3 ? '#' : undefined,
  status: randomFrom(approvalStatuses),
}));

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const mockMonthlyRevenue: MonthlyRevenue[] = months.map((m) => {
  const revenue = randomInt(20000, 80000);
  const expenses = randomInt(10000, revenue * 0.7);
  return { month: m, revenue, expenses, profit: revenue - expenses };
});
