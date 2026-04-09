import { useParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDomain } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/format';

export default function DomainDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: d, isLoading } = useDomain(id);

  useHeaderConfig({
    title: d?.domain ?? 'Domain',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/domains' },
      { label: 'Domains', href: '/assets/domains' },
      { label: d?.domain ?? '…' },
    ],
  });

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!d) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Domain not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/30">
              <Globe className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{d.domain}</CardTitle>
              <StatusBadge status={d.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Registrar" value={d.registrar} />
          <Field label="Expiry" value={d.expiryDate ? d.expiryDate.slice(0, 10) : '—'} />
          <Field label="DNS / hosting" value={d.dnsProvider} />
          <Field label="Annual cost" value={`${formatCurrency(d.annualCost)}/yr`} />
          <Field label="Auto-renew" value={d.autoRenew ? 'Yes' : 'No'} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
