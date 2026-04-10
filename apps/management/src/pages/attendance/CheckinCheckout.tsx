import { useMemo, useState } from 'react';
import { LogIn, LogOut, Building2, Laptop, MapPin, Clock } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCheckIn, useCheckOut, useTodayAttendance } from '@/api/attendance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

type WorkType = 'OFFICE' | 'REMOTE' | 'FIELD';

const workTypeOptions: { value: WorkType; label: string; icon: typeof Building2; description: string }[] = [
  { value: 'OFFICE', label: 'Office', icon: Building2, description: 'Working from the office' },
  { value: 'REMOTE', label: 'Remote', icon: Laptop, description: 'Working from home' },
  { value: 'FIELD', label: 'Field', icon: MapPin, description: 'On-site / client visit' },
];

export default function CheckinCheckout() {
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType>('OFFICE');
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const { data: today } = useTodayAttendance();

  useHeaderConfig(useMemo(() => ({
    title: 'Check In / Check Out',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Attendance' }, { label: 'Check In/Out' }],
    actions: [],
  }), []));

  const onCheckIn = async () => {
    try {
      await checkIn.mutateAsync({ workType: selectedWorkType });
      toast.success(`Checked in as ${selectedWorkType.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const onCheckOut = async () => {
    try {
      await checkOut.mutateAsync({});
      toast.success('Checked out successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-out failed');
    }
  };

  const hasCheckedIn = !!today?.checkInTime;
  const hasCheckedOut = !!today?.checkOutTime;

  const getWorkTypeLabel = (type: string) => {
    const opt = workTypeOptions.find(o => o.value === type);
    return opt?.label || type;
  };

  return (
    <PageTransition className="max-w-xl mx-auto">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={today?.status === 'LATE' ? 'warning' : today?.status === 'PRESENT' ? 'success' : 'default'} size="md">
                {today?.status || 'NOT CHECKED IN'}
              </Badge>
              {today?.workType && (
                <Badge variant="info" size="sm">
                  {getWorkTypeLabel(today.workType)}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check In</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {hasCheckedIn && today?.checkInTime
                    ? new Date(today.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check Out</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {hasCheckedOut && today?.checkOutTime
                    ? new Date(today.checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
            </div>

            {today?.hoursWorked != null && today.hoursWorked > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hours worked: <span className="font-semibold">{today.hoursWorked.toFixed(1)}h</span>
              </p>
            )}
          </CardContent>
        </Card>

        {!hasCheckedIn && (
          <Card>
            <CardHeader>
              <CardTitle>Select Work Type</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose where you're working from today</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {workTypeOptions.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = selectedWorkType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedWorkType(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500')} />
                      <span className={cn('font-medium', isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300')}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            icon={<LogIn />}
            onClick={onCheckIn}
            isLoading={checkIn.isPending}
            disabled={hasCheckedIn}
            className="flex-1"
            size="lg"
          >
            Check In
          </Button>
          <Button
            variant="outline"
            icon={<LogOut />}
            onClick={onCheckOut}
            isLoading={checkOut.isPending}
            disabled={!hasCheckedIn || hasCheckedOut}
            className="flex-1"
            size="lg"
          >
            Check Out
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
