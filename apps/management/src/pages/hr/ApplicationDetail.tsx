import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, FileText, Edit, Trash2, Save, X } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApplication, useUpdateApplication, useDeleteApplication } from '@/api/hr';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
import type { JobApplication } from '@/types/models';

const STAGE_TRANSITIONS: Record<JobApplication['stage'], JobApplication['stage'][]> = {
  new: ['screening', 'rejected'],
  screening: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['new'],
};

const STAGE_LABELS: Record<JobApplication['stage'], string> = {
  new: 'New', screening: 'Screening', interview: 'Interview',
  offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
};

const STATUS_MAP: Record<string, string> = {
  new: 'New', screening: 'Screening', interview: 'Interview',
  offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
      ))}
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const { data: app, isLoading } = useApplication(id);

  const canManage = perm.can('hr.recruitment');

  const headerConfig = useMemo(() => ({
    title: app?.applicantName ?? 'Application',
    breadcrumbs: [
      { label: 'HR' },
      { label: 'Applications', href: '/hr/applications' },
      { label: app?.applicantName ?? '...' },
    ],
    actions: canManage ? [
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setShowDelete(true) },
    ] : [],
  }), [app, canManage]);

  useHeaderConfig(headerConfig);

  const handleStageChange = async (newStage: JobApplication['stage']) => {
    if (!id) return;
    try {
      await updateApplication.mutateAsync({ id, status: STATUS_MAP[newStage] ?? newStage });
      toast.success(`Moved to ${STAGE_LABELS[newStage]}`);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      await updateApplication.mutateAsync({ id, notes, interviewerNotes });
      toast.success('Notes saved');
      setEditingNotes(false);
    } catch {
      toast.error('Failed to save notes');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteApplication.mutateAsync(id);
      toast.success('Application deleted');
      navigate('/hr/applications');
    } catch {
      toast.error('Failed to delete application');
    }
  };

  const startEditing = () => {
    setNotes(app?.notes || '');
    setInterviewerNotes('');
    setEditingNotes(true);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </PageTransition>
    );
  }

  if (!app) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-gray-500">Application not found</p>
        </div>
      </PageTransition>
    );
  }

  const transitions = STAGE_TRANSITIONS[app.stage] ?? [];

  return (
    <PageTransition className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applicant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="font-medium">{app.applicantName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm">{app.applicantEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Applied</span>
              <span className="text-sm">{new Date(app.appliedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Rating</span>
              <StarRating rating={app.rating} />
            </div>
            {app.resumeUrl && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Resume</span>
                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary-600 hover:underline dark:text-primary-400">
                  <FileText className="h-3.5 w-3.5" /> View CV
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Position</span>
              <span className="font-medium">{app.positionTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Stage</span>
              <StatusBadge status={app.stage} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
          {canManage && !editingNotes && (
            <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} onClick={startEditing}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-4">
              <Textarea
                label="General Notes"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this application..."
              />
              <Textarea
                label="Interviewer Notes"
                rows={3}
                value={interviewerNotes}
                onChange={e => setInterviewerNotes(e.target.value)}
                placeholder="Add interviewer feedback..."
              />
              <div className="flex gap-2">
                <Button size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSaveNotes} isLoading={updateApplication.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => setEditingNotes(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {app.notes || <span className="text-gray-400 italic">No notes yet</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {canManage && transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Move to Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {transitions.map(nextStage => (
                <Button
                  key={nextStage}
                  variant={nextStage === 'rejected' ? 'danger' : nextStage === 'hired' ? 'primary' : 'outline'}
                  isLoading={updateApplication.isPending}
                  onClick={() => handleStageChange(nextStage)}
                >
                  {STAGE_LABELS[nextStage]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Application"
        message={`Are you sure you want to delete the application from ${app?.applicantName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteApplication.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
