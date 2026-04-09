import { useParams } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useWebsite } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompact } from '@/lib/format';

export default function WebsiteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: w, isLoading } = useWebsite(id);

  useHeaderConfig({
    title: w?.name ?? 'Website',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/websites' },
      { label: 'Websites', href: '/assets/websites' },
      { label: w?.name ?? '…' },
    ],
  });

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!w) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Website not found.</p>
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
              <Globe2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{w.name}</CardTitle>
              <StatusBadge status={w.status} className="mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">URL</p>
            <a href={w.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary-600 hover:underline dark:text-primary-400">
              {w.url}
            </a>
          </div>
          <Field label="Server" value={w.serverName} />
          <Field label="Domain" value={w.domainName} />
          <Field label="Monthly traffic" value={formatCompact(w.monthlyTraffic)} />
          <Field label="Last deploy" value={w.lastDeploy} />
        </CardContent>
      </Card>
    </PageTransition>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
