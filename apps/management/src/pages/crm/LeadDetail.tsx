import { useParams } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useLead } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/mocks/generators';
import { Mail, Phone, Building2, Globe, Calendar, User, DollarSign, Tag } from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(id!);

  useHeaderConfig({
    title: lead?.name ?? 'Lead',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Leads', href: '/crm/leads' }, { label: lead?.name ?? '...' }],
  });

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><Skeleton className="h-40 w-full rounded" /></Card>
          <Card><Skeleton className="h-40 w-full rounded" /></Card>
        </div>
      </PageTransition>
    );
  }

  if (!lead) {
    return (
      <PageTransition>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">Lead not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header card */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={lead.name} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{lead.name}</span>
                <StatusBadge status={lead.stage} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{lead.company}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(lead.value)}</p>
            <Badge variant="info" size="sm">Deal Value</Badge>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lead.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={lead.phone} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={lead.company} />
              <InfoRow icon={<Globe className="h-4 w-4" />} label="Source" value={lead.source} />
            </div>
          </CardContent>
        </Card>

        {/* Deal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Value" value={formatCurrency(lead.value)} />
              <InfoRow icon={<Tag className="h-4 w-4" />} label="Stage" value={<StatusBadge status={lead.stage} />} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Assignee" value={
                <div className="flex items-center gap-2">
                  <Avatar name={lead.assigneeName} src={lead.assigneeAvatar} size="xs" />
                  <span>{lead.assigneeName}</span>
                </div>
              } />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Last Contact" value={lead.lastContactDate} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={lead.createdAt} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <div className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}
