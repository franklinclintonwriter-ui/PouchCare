import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';

export default function Preferences() {
  const [denseTables, setDenseTables] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timezone, setTimezone] = useState('UTC');

  const headerConfig = useMemo(() => ({
    title: 'Preferences',
    breadcrumbs: [
      { label: 'Settings', href: '/settings/profile' },
      { label: 'Preferences', icon: SlidersHorizontal },
    ],
    actions: [],
  }), []);

  useHeaderConfig(headerConfig);

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dense Tables</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Show tighter row spacing in data tables.</p>
            </div>
            <Toggle checked={denseTables} onChange={setDenseTables} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Refresh</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Refresh dashboard and lists periodically.</p>
            </div>
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={[
              { label: 'UTC', value: 'UTC' },
              { label: 'Asia/Dhaka', value: 'Asia/Dhaka' },
              { label: 'Asia/Dubai', value: 'Asia/Dubai' },
              { label: 'America/New_York', value: 'America/New_York' },
            ]}
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
