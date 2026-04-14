import type { PortalMember, PortalOrder, WalletTransaction, Referral, CommissionRecord, PayoutRecord } from '@/types/models';
import type { PortalMemberStatus, OrderStatus, WalletTxType, CommissionStatus, PayoutStatus, PaymentMethod } from '@/types/enums';
import { fakeId, fakeName, fakeEmail, fakePhone, randomFrom, randomInt, randomFloat, fakeDateRecent, fakeDatePast, countries } from './generators';
import { mockServices } from './assets';

const memberStatuses: PortalMemberStatus[] = ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'INACTIVE'];

export const mockPortalMembers: PortalMember[] = Array.from({ length: 25 }, () => {
  const name = fakeName();
  return {
    id: fakeId(), fullName: name, email: fakeEmail(name), country: randomFrom(countries),
    phone: fakePhone(), status: randomFrom(['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'] as PortalMemberStatus[]),
    walletBalance: randomFloat(0, 5000), referralCode: `PC${randomInt(10000, 99999)}`,
    totalOrders: randomInt(0, 30), totalSpent: randomInt(0, 15000),
    referralsCount: randomInt(0, 12), joinDate: fakeDatePast(12),
  };
});

const orderStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

export const mockPortalOrders: PortalOrder[] = Array.from({ length: 45 }, (_, i) => {
  const member = randomFrom(mockPortalMembers);
  const service = randomFrom(mockServices);
  return {
    id: fakeId(), number: `ORD-${String(5000 + i).padStart(4, '0')}`,
    memberId: member.id, memberName: member.fullName,
    serviceName: service.name, serviceId: service.id,
    amount: randomInt(service.priceRange.min, service.priceRange.max),
    status: randomFrom(orderStatuses),
    placedDate: fakeDateRecent(60),
    deliveryDate: Math.random() > 0.4 ? fakeDateRecent(10) : undefined,
    assignedStaff: Math.random() > 0.3 ? fakeName() : undefined,
    progress: randomInt(0, 100),
    specifications: { url: `https://example${i}.com`, notes: 'Standard delivery' },
  };
});

const txTypes: WalletTxType[] = ['DEPOSIT', 'ORDER_PAYMENT', 'COMMISSION_CREDIT', 'REFUND', 'PAYOUT', 'ADJUSTMENT'];

export const mockWalletTransactions: WalletTransaction[] = Array.from({ length: 35 }, () => {
  const type = randomFrom(txTypes);
  const isCredit = ['DEPOSIT', 'COMMISSION_CREDIT', 'REFUND'].includes(type);
  const amount = randomInt(10, 2000) * (isCredit ? 1 : -1);
  return {
    id: fakeId(), type, description: `${type.replace(/_/g, ' ').toLowerCase()}`,
    amount, balanceAfter: randomFloat(100, 5000),
    createdAt: fakeDateRecent(45),
  };
});

function buildReferralTree(depth: number): Referral[] {
  if (depth <= 0) return [];
  return Array.from({ length: randomInt(1, 4) }, () => {
    const name = fakeName();
    return {
      id: fakeId(), memberName: name, email: fakeEmail(name),
      status: randomFrom(memberStatuses), joinedDate: fakeDatePast(6),
      ordersCount: randomInt(0, 10), earnings: randomFloat(0, 500),
      children: depth > 1 ? buildReferralTree(depth - 1) : undefined,
    };
  });
}

export const mockReferralTree: Referral[] = buildReferralTree(3);

const commissionStatuses: CommissionStatus[] = ['PENDING_HOLD', 'AVAILABLE', 'PAID_OUT', 'CANCELLED', 'FRAUD_HOLD'];

export const mockCommissions: CommissionRecord[] = Array.from({ length: 24 }, () => {
  const member = randomFrom(mockPortalMembers);
  return {
    id: fakeId(), memberId: member.id, memberName: member.fullName,
    orderRef: `ORD-${String(5000 + randomInt(0, 44)).padStart(4, '0')}`,
    amount: randomFloat(5, 200), status: randomFrom(commissionStatuses),
    earnedDate: fakeDateRecent(30),
    availableDate: Math.random() > 0.4 ? fakeDateRecent(15) : undefined,
    paidDate: Math.random() > 0.7 ? fakeDateRecent(5) : undefined,
  };
});

const payoutStatuses: PayoutStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'];
const paymentMethods: PaymentMethod[] = ['PAYONEER', 'USDT_TRC20', 'BINANCE', 'BANK_TRANSFER', 'CASH'];

export const mockPayouts: PayoutRecord[] = Array.from({ length: 14 }, () => {
  const member = randomFrom(mockPortalMembers);
  return {
    id: fakeId(), memberId: member.id, memberName: member.fullName,
    amount: randomFloat(50, 3000), method: randomFrom(paymentMethods),
    accountDetails: '****1234', status: randomFrom(payoutStatuses),
    requestedDate: fakeDateRecent(20),
    processedDate: Math.random() > 0.5 ? fakeDateRecent(5) : undefined,
  };
});
