import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useStaffLeaderboard } from '@/api/staff';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

type LeaderboardRow = {
  id: string;
  name: string;
  branch: string | null;
  primarySkill: string | null;
  averageTaskRating: number | null;
  tasksCompleted: number;
  systemRole: string;
};

export default function StaffLeaderboard() {
  const { data = [], isLoading } = useStaffLeaderboard();

  const headerConfig = useMemo(() => ({
    title: 'Staff Leaderboard',
    breadcrumbs: [
      { label: 'Staff', href: '/staff' },
      { label: 'Leaderboard', icon: Trophy },
    ],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  const columns: Column<LeaderboardRow>[] = [
    {
      key: 'name',
      label: 'Staff',
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.systemRole}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'averageTaskRating',
      label: 'Avg Rating',
      align: 'center',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.averageTaskRating?.toFixed(1) ?? '-'}
        </Badge>
      ),
    },
    {
      key: 'tasksCompleted',
      label: 'Tasks Completed',
      align: 'center',
      render: (row) => <span className="font-medium">{row.tasksCompleted}</span>,
    },
    {
      key: 'primarySkill',
      label: 'Skill',
      render: (row) => <span>{row.primarySkill ?? '-'}</span>,
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => <span>{row.branch ?? '-'}</span>,
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No leaderboard data"
        emptyDescription="Leaderboard data will populate as staff submit reports."
      />
    </PageTransition>
  );
}
