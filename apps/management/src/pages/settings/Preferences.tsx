import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';

const PREFS_KEY = 'pouchcare_preferences';

interface Prefs {
  denseTables: boolean;
  autoRefresh: boolean;
  timezone: string;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPrefs;
}

const defaultPrefs: Prefs = {
  denseTables: false,
  autoRefresh: true,
  timezone: 'Asia/Dhaka',
};

export default function Preferences() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const save = (updates: Partial<Prefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

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
            <Toggle checked={prefs.denseTables} onChange={v => save({ denseTables: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Refresh</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Refresh dashboard and lists periodically.</p>
            </div>
            <Toggle checked={prefs.autoRefresh} onChange={v => save({ autoRefresh: v })} />
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
            value={prefs.timezone}
            onChange={(e) => save({ timezone: e.target.value })}
            options={[
              { label: 'UTC', value: 'UTC' },
              { label: 'Asia/Dhaka', value: 'Asia/Dhaka' },
              { label: 'Asia/Dubai', value: 'Asia/Dubai' },
              { label: 'America/New_York', value: 'America/New_York' },
            ]}
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-gray-400">Preferences are saved automatically to your browser.</p>
    </PageTransition>
  );
}
