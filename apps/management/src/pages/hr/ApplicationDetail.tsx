import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, FileText } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApplications, useUpdateApplication } from '@/api/hr';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
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

  const { data: app, isLoading } = useQuery<JobApplication | null>({
    queryKey: ['application', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/hr/applications/${id}`);
      const inferredRating = Math.max(1, Math.min(5, Math.round((data.experienceYears ?? 0) / 2) || 3));
      return {
        id: data.id,
        applicantName: data.applicantName,
        applicantEmail: data.email,
        positionId: data.positionId,
        positionTitle: data.position?.title ?? 'Unknown Position',
        stage: (data.status ?? 'new').toLowerCase() as JobApplication['stage'],
        resumeUrl: data.cvUrl ?? undefined,
        rating: inferredRating,
        appliedDate: data.appliedDate ?? new Date().toISOString(),
        notes: data.notes ?? '',
      };
    },
    enabled: !!id,
  });

  const headerConfig = useMemo(() => ({
    title: app?.applicantName ?? 'Application',
    breadcrumbs: [
      { label: 'HR' },
      { label: 'Applications', href: '/hr/applications' },
      { label: app?.applicantName ?? '...' },
    ],
    actions: [],
  }), [app]);

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
          <Button variant="outline" onClick={() => navigate('/hr/applications')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </PageTransition>
    );
  }

  const transitions = STAGE_TRANSITIONS[app.stage] ?? [];

  return (
    <PageTransition className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/hr/applications')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
      </Button>

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
            {app.notes && (
              <div className="pt-2">
                <span className="text-sm text-gray-500">Notes</span>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{app.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {perm.isHR && transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Move to Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {transitions.map(nextStage => (
                <Button
                  key={nextStage}
                  variant={nextStage === 'rejected' ? 'ghost' : 'outline'}
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
    </PageTransition>
  );
}
