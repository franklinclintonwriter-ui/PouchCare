import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useSubmitReport } from '@/api/reports';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function ReportSubmit() {
  const navigate = useNavigate();
  const submit = useSubmitReport();
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [plannedTomorrow, setPlannedTomorrow] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hoursWorked, setHoursWorked] = useState('8');
  const [mood, setMood] = useState('good');

  useHeaderConfig(useMemo(() => ({
    title: 'Submit Daily Report',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Reports', href: '/reports' }, { label: 'Submit' }],
    actions: [],
  }), []));

  const onSubmit = async () => {
    if (!tasksCompleted.trim() || !plannedTomorrow.trim()) return toast.error('Fill required fields');
    try {
      await submit.mutateAsync({
        tasksCompleted,
        plannedTomorrow,
        blockers: blockers || undefined,
        hoursWorked: Number(hoursWorked || 0),
        mood,
      });
      toast.success('Report submitted');
      navigate('/reports');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  return (
    <PageTransition className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Daily Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea label="Tasks Completed" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} />
          <Textarea label="Planned For Tomorrow" value={plannedTomorrow} onChange={(e) => setPlannedTomorrow(e.target.value)} />
          <Textarea label="Blockers" value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" min={0} max={24} step="0.5" label="Hours Worked" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} />
            <Select
              label="Mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              options={[
                { label: 'Great', value: 'great' },
                { label: 'Good', value: 'good' },
                { label: 'Okay', value: 'okay' },
                { label: 'Bad', value: 'bad' },
              ]}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={onSubmit} isLoading={submit.isPending}>Submit Report</Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
