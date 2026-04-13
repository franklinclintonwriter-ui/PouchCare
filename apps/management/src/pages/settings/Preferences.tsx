import { useMemo, useState } from 'react';
import { SlidersHorizontal, DollarSign } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { useCurrency, useUpdateCurrencyPreference, useExchangeRate } from '@/hooks/useCurrency';
import type { Currency } from '@/store/currencyStore';
import { toast } from 'sonner';

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
  const { currency, exchangeRate } = useCurrency();
  const updateCurrency = useUpdateCurrencyPreference();
  const { data: rateData } = useExchangeRate();

  const save = (updates: Partial<Prefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    try {
      await updateCurrency.mutateAsync(newCurrency);
      toast.success(`Currency changed to ${newCurrency}`);
    } catch {
      toast.error('Failed to update currency preference');
    }
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
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400" aria-hidden title="Taka">৳</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>/</span>
            <span title="US Dollar" className="inline-flex shrink-0">
              <DollarSign className="h-5 w-5" aria-hidden />
            </span>
            <span>Currency</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select
              label="Display Currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              disabled={updateCurrency.isPending}
              options={[
                { label: '৳ BDT (Bangladeshi Taka)', value: 'BDT' },
                { label: '$ USD (US Dollar)', value: 'USD' },
              ]}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              All monetary values will be shown in your selected currency.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Current Exchange Rate</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-semibold">$1</span>
                <span className="text-gray-400">=</span>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  ৳{exchangeRate.usdToBdt.toLocaleString()}
                </span>
              </div>
              {rateData?.effectiveDate && (
                <span className="text-xs text-gray-400">
                  as of {new Date(rateData.effectiveDate).toLocaleDateString()}
                </span>
              )}
            </div>
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

      <p className="text-center text-xs text-gray-400">
        Currency preference is saved to your account. Other preferences are saved locally.
      </p>
    </PageTransition>
  );
}
