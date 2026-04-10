import { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { PageTransition } from '@/components/ui/PageTransition';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import type { SerpResultRow } from '@/features/tools/types';
import { downloadCsv } from '@/features/tools/csv';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { cn } from '@/utils/cn';
import type { PaginationMeta } from '@/types/api';
import { useSerpTop100, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';

/** value = "gl|hl" for API */
const MARKETS = [
  { value: 'us|en', label: 'United States (English)' },
  { value: 'gb|en', label: 'United Kingdom (English)' },
  { value: 'bd|en', label: 'Bangladesh (English)' },
  { value: 'pk|en', label: 'Pakistan (English)' },
  { value: 'ae|en', label: 'United Arab Emirates (English)' },
];

const PAGE_SIZE = 25;

export default function SerpTop100ToolPage() {
  const [keyword, setKeyword] = useState('best seo company');
  const [market, setMarket] = useState(MARKETS[0]!.value);
  const [running, setRunning] = useState(false);
  const [doneOnce, setDoneOnce] = useState(false);
  const [allRows, setAllRows] = useState<SerpResultRow[]>([]);
  const [page, setPage] = useState(1);
  const [feature, setFeature] = useState<string | 'all'>('all');
  const { push } = useToolHistory('serp-top-100');
  const { data: status } = useToolsStatus();
  const serpMutation = useSerpTop100();

  useHeaderConfig({
    title: 'SERP Top 100',
    breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'SERP Top 100' }],
    actions: [],
  });

  const run = useCallback(async () => {
    const k = keyword.trim();
    if (!k) return;
    const [gl, hl] = market.split('|');
    if (!gl || !hl) return;
    setRunning(true);
    setAllRows([]);
    setDoneOnce(false);
    try {
      const out = await serpMutation.mutateAsync({ keyword: k, gl, hl, num: 100 });
      setAllRows(out.results);
      setPage(1);
      setDoneOnce(true);
      push(`${k} @ ${market}`);
      toast.success(`Loaded ${out.results.length} organic results (SerpAPI)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'SERP request failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }, [keyword, market, push, serpMutation]);

  const filtered = useMemo(() => {
    if (feature === 'all') return allRows;
    return allRows.filter((r) => r.features.some((f) => f.toLowerCase().includes(feature.toLowerCase())));
  }, [allRows, feature]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pagination: PaginationMeta | undefined = useMemo(() => {
    if (!filtered.length) return undefined;
    return {
      total: filtered.length,
      page,
      limit: PAGE_SIZE,
      totalPages,
    };
  }, [filtered.length, page, totalPages]);

  const columns: Column<SerpResultRow>[] = useMemo(
    () => [
      {
        key: 'pos',
        label: '#',
        width: '52px',
        render: (r) => <span className="font-mono font-semibold text-primary-600">{r.position}</span>,
      },
      {
        key: 'title',
        label: 'Title & URL',
        render: (r) => (
          <div>
            <div className="font-medium text-[var(--color-text-primary)] line-clamp-2">{r.title}</div>
            {r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block text-xs text-primary-600 line-clamp-1 hover:underline"
              >
                {r.url}
              </a>
            ) : null}
          </div>
        ),
      },
      {
        key: 'features',
        label: 'Signals',
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.features.map((f) => (
              <Badge key={f} variant="default" size="sm">
                {f}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  const exportCsv = useCallback(() => {
    if (!filtered.length) return;
    downloadCsv(
      'serp-top-organic.csv',
      ['position', 'url', 'title', 'features'],
      filtered.map((r) => [String(r.position), r.url, r.title, r.features.join('|')]),
    );
  }, [filtered]);

  const featureChips: { id: string | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'snippet', label: 'Snippet' },
    { id: 'rich', label: 'Rich' },
    { id: 'about', label: 'About' },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status} highlight="serp" />

        {running ? (
          <div className="rounded-lg border border-primary-200 bg-primary-50/80 px-4 py-2 text-sm text-primary-900 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-100">
            Fetching Google organic results via SerpAPI…
          </div>
        ) : null}
        {doneOnce && !running && allRows.length > 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            {allRows.length} results loaded
          </div>
        ) : null}

        <ToolRunPanel
          onRun={run}
          onClear={() => {
            setKeyword('');
            setAllRows([]);
            setDoneOnce(false);
            setPage(1);
          }}
          onExportCsv={exportCsv}
          exportDisabled={!filtered.length}
          runLabel="Fetch SERP"
          running={running}
          disabled={!keyword.trim() || !status?.serpApi}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. digital marketing agency"
            />
            <Select label="Market / language" value={market} onChange={(e) => setMarket(e.target.value)} options={MARKETS} />
          </div>
          {!status?.serpApi && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">SERPAPI_API_KEY</code> on the API server to
              enable this tool.
            </p>
          )}
        </ToolRunPanel>

        {allRows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {featureChips.map((f) => (
                <button
                  key={String(f.id)}
                  type="button"
                  onClick={() => {
                    setFeature(f.id);
                    setPage(1);
                  }}
                  className={cn(
                    'min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-medium sm:min-h-0',
                    feature === f.id
                      ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-100'
                      : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <DataTable
              columns={columns}
              data={pageRows}
              compact
              pagination={pagination}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </PageTransition>
  );
}
