import { useCallback, useMemo, useState } from 'react';
import { Search, Download, Play, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatsRow } from '@/components/shared/StatsRow';
import { Badge } from '@/components/ui/Badge';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { downloadCsv } from '@/features/tools/csv';
import type { KeywordMetric } from '@/features/tools/types';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { useKeywordsResearch, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

export default function KeywordsToolPage() {
  const { formatCurrency } = useCurrency();
  const [seed, setSeed] = useState('seo agency dubai');
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<KeywordMetric[]>([]);
  const { push } = useToolHistory('keywords');
  const { data: status } = useToolsStatus();
  const mutation = useKeywordsResearch();

  const clearAll = useCallback(() => {
    setSeed('');
    setRows([]);
  }, []);

  const run = useCallback(async () => {
    const s = seed.trim();
    if (!s) return;
    setRunning(true);
    setRows([]);
    try {
      const out = await mutation.mutateAsync(s);
      setRows(out.rows);
      push(s);
      toast.success(`Loaded ${out.rows.length} keyword ideas (DataForSEO)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }, [seed, mutation, push]);

  const exportCsv = useCallback(() => {
    if (!rows.length) return;
    downloadCsv(
      'keywords.csv',
      ['keyword', 'volume', 'kd', 'cpcUsd', 'intent', 'trendPct'],
      rows.map((r) => [
        r.keyword,
        String(r.volume),
        String(r.kd),
        String(r.cpcUsd),
        r.intent,
        String(r.trendPct),
      ]),
    );
  }, [rows]);

  const headerConfig = useMemo(
    () => ({
      title: 'Keywords',
      description: rows.length ? `${rows.length} ideas` : undefined,
      breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'Keywords' }],
      actions: [
        {
          type: 'button' as const,
          label: 'Export',
          ariaLabel: 'Export CSV',
          icon: Download,
          variant: 'secondary' as const,
          disabled: rows.length === 0,
          onClick: exportCsv,
        },
        {
          type: 'button' as const,
          label: 'Clear',
          icon: Trash2,
          variant: 'ghost' as const,
          onClick: clearAll,
        },
        {
          type: 'button' as const,
          label: 'Research',
          icon: Play,
          variant: 'primary' as const,
          disabled: !seed.trim() || !status?.dataForSeo,
          isLoading: running,
          onClick: run,
        },
      ],
    }),
    [rows.length, exportCsv, clearAll, run, seed, status?.dataForSeo, running],
  );

  useHeaderConfig(headerConfig, [exportCsv, clearAll, run, rows.length, running, seed, status?.dataForSeo]);

  const stats = useMemo(() => {
    if (!rows.length) return [];
    const avgKd = Math.round(rows.reduce((a, r) => a + r.kd, 0) / rows.length);
    const avgVol = Math.round(rows.reduce((a, r) => a + r.volume, 0) / rows.length);
    const maxCpc = Math.max(...rows.map((r) => r.cpcUsd));
    return [
      {
        title: 'Avg. difficulty',
        value: `${avgKd}`,
        icon: <Search />,
        iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      },
      {
        title: 'Avg. volume',
        value: avgVol.toLocaleString(),
        icon: <Search />,
        iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      },
      {
        title: 'Max CPC',
        value: formatCurrency(maxCpc),
        icon: <Search />,
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      },
    ];
  }, [rows, formatCurrency]);

  const columns: Column<KeywordMetric>[] = useMemo(
    () => [
      {
        key: 'keyword',
        label: 'Keyword',
        render: (r) => <span className="font-medium text-[var(--color-text-primary)]">{r.keyword}</span>,
      },
      {
        key: 'volume',
        label: 'Volume',
        render: (r) => r.volume.toLocaleString(),
      },
      {
        key: 'kd',
        label: 'KD',
        render: (r) => <span className="font-mono">{r.kd}</span>,
      },
      {
        key: 'cpc',
        label: 'CPC',
        render: (r) => formatCurrency(r.cpcUsd),
      },
      {
        key: 'intent',
        label: 'Intent',
        render: (r) => (
          <Badge variant="default" size="sm">
            {r.intent}
          </Badge>
        ),
      },
      {
        key: 'trend',
        label: 'Trend %',
        render: (r) => (
          <span className={r.trendPct >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            {r.trendPct >= 0 ? '+' : ''}
            {r.trendPct}%
          </span>
        ),
      },
    ],
    [formatCurrency],
  );

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status} highlight="dfs" compact />

        <ToolPageChrome
          accent="amber"
          eyebrow="SEO · DataForSEO"
          title="Keyword expansion"
          hint="Seed → volume, difficulty, CPC, intent — export from the toolbar."
        />

        <ToolRunPanel onRun={run} showActions={false} runLabel="Research" running={running}>
          <Input
            label="Seed keyword"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. link building services"
          />
          {!status?.dataForSeo && (
            <p className="text-xs text-amber-700 dark:text-amber-300">Configure DataForSEO on the API server.</p>
          )}
        </ToolRunPanel>

        {rows.length > 0 && (
          <>
            <StatsRow items={stats} />
            <DataTable columns={columns} data={rows} compact emptyTitle="No keywords" emptyDescription="Enter a seed above." />
          </>
        )}
      </div>
    </PageTransition>
  );
}
