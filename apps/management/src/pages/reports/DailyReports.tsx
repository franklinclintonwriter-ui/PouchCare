import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, TrendingUp, Smile, Meh, Frown, Heart, Send, type LucideIcon } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDailyReports, useReviewReport } from '@/api/reports';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { StatsRow } from '@/components/shared/StatsRow';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
import type { DailyReport } from '@/types/models';
import { toast } from 'sonner';

const moodConfig: Record<string, { icon: LucideIcon; color: string }> = {
  great: { icon: Heart, color: 'text-rose-500' },
  good: { icon: Smile, color: 'text-emerald-500' },
  okay: { icon: Meh, color: 'text-amber-500' },
  bad: { icon: Frown, color: 'text-red-500' },
};

export default function DailyReports() {
  const navigate = useNavigate();
  const perm = usePermission();
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<DailyReport | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading } = useDailyReports({ page, limit: 20 });
  const reviewReport = useReviewReport();

  const canReview = perm.can('hr.performance') || perm.isManager;

  const handleReview = async () => {
    if (!reviewTarget) return;
    try {
      await reviewReport.mutateAsync({ id: reviewTarget.id, note: reviewNote });
      toast.success('Report reviewed');
      setReviewTarget(null);
      setReviewNote('');
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const reports = data?.data ?? [];
  const meta = data?.meta;

  // Fetch all reports for accurate stats (not just the paginated page)
  const { data: allData } = useDailyReports({});
  const allReports = allData?.data ?? [];

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const avgHours = allReports.length > 0
      ? (allReports.reduce((s, r) => s + r.hoursWorked, 0) / allReports.length).toFixed(1)
      : '0';
    const avgTasks = allReports.length > 0
      ? (allReports.reduce((s, r) => s + r.tasksCompleted, 0) / allReports.length).toFixed(1)
      : '0';
    const approved = allReports.filter(r => r.status === 'APPROVED_MGR' || r.status === 'VERIFIED').length;
    return [
      { title: 'Total Reports', value: total, icon: <FileText />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Avg Hours', value: avgHours, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Avg Tasks/Day', value: avgTasks, icon: <TrendingUp />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
      { title: 'Approved', value: approved, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [allReports, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Daily Reports',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Reports' }, { label: 'Daily Reports' }],
    actions: [{ type: 'button' as const, label: 'Submit Report', icon: Send, onClick: () => navigate('/reports/submit') }],
  }), [navigate]);

  useHeaderConfig(headerConfig);

  const columns: Column<DailyReport>[] = [
    {
      key: 'staffName',
      label: 'Staff',
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.staffName} src={row.avatarUrl} size="xs" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{row.staffName}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'tasksCompleted',
      label: 'Tasks Done',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{row.tasksCompleted}</span>
      ),
    },
    {
      key: 'hoursWorked',
      label: 'Hours',
      align: 'center',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.hoursWorked}h</span>
      ),
    },
    {
      key: 'mood',
      label: 'Mood',
      align: 'center',
      render: (row) => {
        const cfg = moodConfig[row.mood] ?? moodConfig.okay;
        const Icon = cfg.icon;
        return <Icon className={cn('mx-auto h-4.5 w-4.5', cfg.color)} />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    ...(canReview ? [{
      key: 'review' as keyof DailyReport,
      label: 'Review',
      render: (row: DailyReport) => {
        const canAct = row.status === 'SUBMITTED' || row.status === 'ESCALATED';
        return canAct ? (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setReviewTarget(row); setReviewNote(''); }}>
            Review
          </Button>
        ) : null;
      },
    }] : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No reports found"
          emptyDescription="No daily reports have been submitted yet"
        />
      </div>

      <Modal
        isOpen={!!reviewTarget}
        onClose={() => { setReviewTarget(null); setReviewNote(''); }}
        title={`Review: ${reviewTarget?.staffName ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setReviewTarget(null); setReviewNote(''); }}>Cancel</Button>
            <Button isLoading={reviewReport.isPending} onClick={handleReview}>Submit Review</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Report date: <span className="font-medium">{reviewTarget ? new Date(reviewTarget.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
          </p>
          <Textarea
            label="Review note"
            placeholder="Feedback or approval note…"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </PageTransition>
  );
}
