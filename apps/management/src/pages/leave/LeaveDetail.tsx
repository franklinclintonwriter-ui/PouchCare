import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useLeaveRequest, useApproveLeave, useRejectLeave, useCancelLeave } from '@/api/leave';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const leaveTypeBadge: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ANNUAL: 'primary',
  SICK: 'danger',
  EMERGENCY: 'warning',
  MATERNITY: 'info',
  PATERNITY: 'info',
  UNPAID: 'default',
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="h-4 w-4" /> },
  APPROVED: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-4 w-4" /> },
  REJECTED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-4 w-4" /> },
  CANCELLED: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: <Ban className="h-4 w-4" /> },
};

export default function LeaveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const perm = usePermission();

  const { data: leave, isLoading, isError } = useLeaveRequest(id);
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const cancelLeave = useCancelLeave();

  const headerConfig = useMemo(() => ({
    title: 'Leave Request Details',
    breadcrumbs: [
      { label: 'Leave', href: '/leave' },
      { label: leave?.staffName || 'Details' },
    ],
    actions: [],
  }), [leave]);

  useHeaderConfig(headerConfig);

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveLeave.mutateAsync(id);
      toast.success('Leave approved');
    } catch {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await rejectLeave.mutateAsync({ id });
      toast.success('Leave rejected');
    } catch {
      toast.error('Failed to reject leave');
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelLeave.mutateAsync(id);
      toast.success('Leave cancelled');
    } catch {
      toast.error('Failed to cancel leave');
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !leave) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Leave request not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/leave')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leave List
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const isPending = leave.status === 'PENDING';
  const isOwn = leave.staffId === user?.id;
  const status = statusConfig[leave.status] || statusConfig.PENDING;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave List
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={leave.staffName} size="lg" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {leave.staffName}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={leaveTypeBadge[leave.type] ?? 'default'}>
                      {leave.type.charAt(0) + leave.type.slice(1).toLowerCase()} Leave
                    </Badge>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.icon}
                      {leave.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex gap-2">
                  {perm.isManager && (
                    <>
                      <Button
                        variant="outline"
                        isLoading={approveLeave.isPending}
                        onClick={handleApprove}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        isLoading={rejectLeave.isPending}
                        onClick={handleReject}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {isOwn && (
                    <Button
                      variant="ghost"
                      isLoading={cancelLeave.isPending}
                      onClick={handleCancel}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Leave Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary-500" />
                Leave Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(leave.startDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(leave.endDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 text-center">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{leave.days}</p>
                <p className="text-sm text-primary-600/70 dark:text-primary-400/70">Total Days</p>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary-500" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reason</p>
                <p className="text-gray-900 dark:text-gray-100">{leave.reason || 'No reason provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Submitted On</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(leave.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {leave.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed By</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{leave.approvedBy}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
