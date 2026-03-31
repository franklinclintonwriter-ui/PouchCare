import { useState } from 'react';
import { cn } from '@/utils/cn';
import { ChevronRight, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { Referral } from '@/types/models';

interface ReferralTreeProps {
  referrals: Referral[];
  maxDepth?: number;
}

function ReferralTree({ referrals, maxDepth = 3 }: ReferralTreeProps) {
  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
        <Users className="h-8 w-8" />
        <span className="text-sm">No referrals yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {referrals.map((ref) => (
        <ReferralNode key={ref.id} referral={ref} depth={0} maxDepth={maxDepth} />
      ))}
    </div>
  );
}

function ReferralNode({ referral, depth, maxDepth }: { referral: Referral; depth: number; maxDepth: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = referral.children && referral.children.length > 0 && depth < maxDepth;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
          hasChildren && 'cursor-pointer',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', isExpanded && 'rotate-90')} />
        ) : (
          <div className="w-3.5" />
        )}
        <Avatar name={referral.memberName} size="xs" />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{referral.memberName}</span>
        </div>
        <Badge variant={referral.status === 'ACTIVE' ? 'success' : referral.status === 'PENDING_VERIFICATION' ? 'warning' : 'default'} size="sm">
          {referral.status === 'ACTIVE' ? 'Active' : referral.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Inactive'}
        </Badge>
        <span className="hidden text-xs text-gray-400 sm:block">{referral.ordersCount} orders</span>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">${referral.earnings.toFixed(0)}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-100 dark:border-gray-700/40" style={{ marginLeft: `${depth * 20 + 22}px` }}>
          {referral.children!.map((child) => (
            <ReferralNode key={child.id} referral={child} depth={depth + 1} maxDepth={maxDepth} />
          ))}
        </div>
      )}
    </div>
  );
}

export { ReferralTree };
