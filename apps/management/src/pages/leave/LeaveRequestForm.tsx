import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApplyLeave } from '@/api/leave';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function LeaveRequestForm() {
  const navigate = useNavigate();
  const apply = useApplyLeave();
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useHeaderConfig(useMemo(() => ({
    title: 'Leave Request',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Leave', href: '/leave' }, { label: 'Request' }],
    actions: [],
  }), []));

  const onSubmit = async () => {
    if (!startDate || !endDate) return toast.error('Start and end date are required');
    if (endDate < startDate) return toast.error('End date must be on or after start date');
    try {
      await apply.mutateAsync({ leaveType, startDate, endDate, reason: reason || undefined });
      toast.success('Leave request submitted');
      navigate('/leave');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  return (
    <PageTransition className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Submit Leave Request</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: 'ANNUAL', label: 'Annual' },
              { value: 'SICK', label: 'Sick' },
              { value: 'EMERGENCY', label: 'Emergency' },
              { value: 'MATERNITY', label: 'Maternity' },
              { value: 'PATERNITY', label: 'Paternity' },
              { value: 'UNPAID', label: 'Unpaid' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={onSubmit} isLoading={apply.isPending}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
