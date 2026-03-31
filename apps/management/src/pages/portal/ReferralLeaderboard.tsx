import { useMemo } from 'react';
import { Medal } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useReferralLeaderboard } from '@/api/portal';
import { formatCurrency } from '@/mocks/generators';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

type Row = {
  rank: number;
  name: string;
  country: string;
  referrals: number;
  earned: number;
};

export default function ReferralLeaderboard() {
  const { data = [], isLoading } = useReferralLeaderboard();

  const headerConfig = useMemo(() => ({
    title: 'Referral Leaderboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Referrals', href: '/portal/referrals' },
      { label: 'Leaderboard', icon: Medal },
    ],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  const columns: Column<Row>[] = [
    {
      key: 'rank',
      label: 'Rank',
      align: 'center',
      render: (row) => (
        <Badge variant={row.rank <= 3 ? 'warning' : 'default'} size="sm">
          #{row.rank}
        </Badge>
      ),
    },
    {
      key: 'name',
      label: 'Member',
      sticky: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    { key: 'country', label: 'Country' },
    { key: 'referrals', label: 'Referrals', align: 'center' },
    {
      key: 'earned',
      label: 'Earned',
      align: 'right',
      render: (row) => <span className="font-medium">{formatCurrency(row.earned)}</span>,
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        getRowId={(row) => `${row.rank}-${row.name}`}
        emptyTitle="No leaderboard data"
      />
    </PageTransition>
  );
}
