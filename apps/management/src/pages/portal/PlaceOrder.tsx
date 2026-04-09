import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServices } from '@/api/services';
import { usePlaceOrder } from '@/api/portal';
import { formatCurrency } from '@/lib/format';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Stepper, type Step } from '@/components/ui/Stepper';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Service } from '@/types/models';
import { toast } from 'sonner';

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  useHeaderConfig({
    title: 'Place Order',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Place Order' },
    ],
  });

  const { data: services, isLoading } = useServices();
  const placeOrder = usePlaceOrder();

  const stepperSteps: Step[] = [
    { label: 'Service', status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'upcoming' },
    { label: 'Configure', status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'upcoming' },
    { label: 'Confirm', status: currentStep === 2 ? 'current' : 'upcoming' },
  ];

  const handleSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep(1);
  };

  const handleConfigure = () => {
    if (!url.trim()) return;
    setCurrentStep(2);
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <Stepper steps={stepperSteps} className="mx-auto max-w-md" />

        {/* Step 1: Service Selection */}
        {currentStep === 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-2 h-3 w-16" />
                    <Skeleton className="mt-3 h-3 w-32" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </Card>
                ))
              : services?.filter((s: any) => s.isActive ?? s.status === 'Active').map((service) => (
                  <Card key={service.id} hover onClick={() => handleSelect(service)}>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
                    <Badge variant="primary" size="sm" className="mt-1">{service.category}</Badge>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(service.priceRange.min)} &ndash; {formatCurrency(service.priceRange.max)}
                    </p>
                    <Button size="sm" className="mt-3 w-full" onClick={() => handleSelect(service)}>
                      Select
                    </Button>
                  </Card>
                ))}
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 1 && (
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>Configure Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedService?.name}
                  </span>
                  <Badge variant="primary" size="sm">{selectedService?.category}</Badge>
                </div>
                <Input
                  label="Website URL"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Textarea
                  label="Notes (optional)"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(0)}>Back</Button>
                  <Button size="sm" onClick={handleConfigure} disabled={!url.trim()}>Continue</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary */}
        {currentStep === 2 && (
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  <SummaryRow label="Service" value={selectedService?.name ?? ''} />
                  <SummaryRow label="Category" value={selectedService?.category ?? ''} />
                  <SummaryRow label="Estimated Price" value={formatCurrency((selectedService as any)?.basePriceUsd ?? (selectedService as any)?.priceRange?.min ?? 0)} />
                  <SummaryRow label="URL" value={url} />
                  {notes && <SummaryRow label="Notes" value={notes} />}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button
                    size="sm"
                    isLoading={placeOrder.isPending}
                    onClick={async () => {
                      if (!selectedService) return;
                      try {
                        await placeOrder.mutateAsync({
                          serviceId: selectedService.id,
                          quantity: 1,
                          requirements: `URL: ${url}${notes ? `\nNotes: ${notes}` : ''}`,
                        });
                        toast.success('Order placed successfully');
                        navigate('/portal/orders');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to place order');
                      }
                    }}
                  >
                    Confirm Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
