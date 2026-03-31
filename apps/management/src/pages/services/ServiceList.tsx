import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServices } from '@/api/services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/mocks/generators';

const categoryColors: Record<string, 'success' | 'primary' | 'info' | 'warning' | 'danger'> = {
  SEO: 'success',
  Development: 'primary',
  Content: 'info',
  Marketing: 'warning',
  Design: 'danger',
};

export default function ServiceList() {
  const { data: services, isLoading } = useServices();

  const headerConfig = useMemo(() => ({
    title: 'Services',
    breadcrumbs: [{ label: 'Services', icon: Briefcase }],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  return (
    <PageTransition>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </Card>
            ))
          : services?.map((service) => (
              <Card key={service.id} hover>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                      <div className="h-4 w-4 rounded-full bg-primary-500" />
                    </div>
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      <Badge variant={categoryColors[service.category] ?? 'default'} size="sm">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(service.priceRange.min)} - {formatCurrency(service.priceRange.max)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {service.orderCount} orders
                    </span>
                  </div>
                  {!service.isActive && (
                    <Badge variant="danger" size="sm" className="mt-2">Inactive</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </PageTransition>
  );
}
