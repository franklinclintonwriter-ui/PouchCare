import { useMemo } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCheckIn, useCheckOut, useTodayAttendance } from '@/api/attendance';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function CheckinCheckout() {
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
      await checkIn.mutateAsync({ workType: 'OFFICE' });
      toast.success('Checked in successfully');
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

  return (
    <PageTransition className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={today?.status === 'LATE' ? 'warning' : 'success'} size="sm">
              {today?.status || 'NOT CHECKED IN'}
            </Badge>
            {hasCheckedIn && today?.checkInTime && (
              <span className="text-sm text-gray-500">In: {new Date(today.checkInTime).toLocaleTimeString()}</span>
            )}
            {hasCheckedOut && today?.checkOutTime && (
              <span className="text-sm text-gray-500">Out: {new Date(today.checkOutTime).toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button icon={<LogIn />} onClick={onCheckIn} isLoading={checkIn.isPending} disabled={hasCheckedIn}>
              Check In
            </Button>
            <Button variant="outline" icon={<LogOut />} onClick={onCheckOut} isLoading={checkOut.isPending} disabled={!hasCheckedIn || hasCheckedOut}>
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
