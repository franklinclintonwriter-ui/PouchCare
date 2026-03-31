import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { useReferrals, useReferralStats } from '@/api/portal';
import { formatCurrency } from '@/mocks/generators';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatsRow } from '@/components/shared/StatsRow';
import { ReferralTree } from '@/components/shared/ReferralTree';
import type { PortalUser } from '@/types/auth';

export default function Referrals() {
  const { user } = useAuthStore();
  const portalUser = user as PortalUser;
  const [copied, setCopied] = useState(false);

  useHeaderConfig({
    title: 'Referrals',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Referrals' },
    ],
  });

  const { data: referrals, isLoading } = useReferrals();
  const { data: referralStats } = useReferralStats();

  const stats = useMemo(() => {
    const all = referrals ?? [];
    const countAll = (refs: typeof all): number =>
      refs.reduce((n, r) => n + 1 + (r.children ? countAll(r.children) : 0), 0);
    const total = countAll(all);
    const active = all.filter(r => r.status === 'ACTIVE').length;
    const earnings = referralStats?.totalCommissionEarned ?? all.reduce((s, r) => s + r.earnings, 0);
    return { total, active, earnings };
  }, [referrals, referralStats?.totalCommissionEarned]);

  const referralCode = referralStats?.referralCode || portalUser?.referralCode || 'PCXXXXX';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Referral Code Hero */}
        <Card className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Your Referral Code</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100">
            {referralCode}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </Card>

        {/* Stats */}
        <StatsRow
          loading={isLoading}
          columns="grid-cols-1 sm:grid-cols-3"
          items={[
            { title: 'Total Referrals', value: stats.total },
            { title: 'Active', value: stats.active },
            { title: 'Total Earnings', value: formatCurrency(stats.earnings) },
          ]}
        />

        {/* Referral Tree */}
        <Card>
          <ReferralTree referrals={referrals ?? []} maxDepth={3} />
        </Card>
      </div>
    </PageTransition>
  );
}
