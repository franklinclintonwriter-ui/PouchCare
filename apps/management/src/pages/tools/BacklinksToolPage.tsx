import { useCallback, useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { StatsRow } from '@/components/shared/StatsRow';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { ExpandableRowDetail } from '@/features/tools/components/ExpandableRowDetail';
import { downloadCsv } from '@/features/tools/csv';
import type { BacklinkRow } from '@/features/tools/types';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { ChevronRight } from 'lucide-react';
import { useBacklinksCheck, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';

export default function BacklinksToolPage() {
  const [url, setUrl] = useState('https://pouchcare.com/');
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<BacklinkRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { push } = useToolHistory('backlinks');
  const { data: status } = useToolsStatus();
  const mutation = useBacklinksCheck();

  useHeaderConfig({
    title: 'Backlink checker',
    breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'Backlinks' }],
    actions: [],
  });

  const run = useCallback(async () => {
    const u = url.trim();
    if (!u) return;
    setRunning(true);
    setRows([]);
    setExpandedId(null);
    try {
      const out = await mutation.mutateAsync(u);
      setRows(out.rows);
      push(u);
      toast.success(`Found ${out.rows.length} referring domains (DataForSEO)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }, [url, mutation, push]);

  const exportCsv = useCallback(() => {
    if (rows.length === 0) return;
    downloadCsv(
      'backlinks.csv',
      ['referringDomain', 'dr', 'ur', 'backlinks', 'anchorText', 'targetUrl', 'firstSeen', 'lastSeen'],
      rows.map((r) => [
        r.referringDomain,
        String(r.dr),
        String(r.ur),
        String(r.backlinks),
        r.anchorText,
        r.targetUrl,
        r.firstSeen,
        r.lastSeen,
      ]),
    );
  }, [rows]);

  const stats = useMemo(() => {
    if (rows.length === 0) return [];
    const avgDr = Math.round(rows.reduce((s, r) => s + r.dr, 0) / rows.length);
    const totalBl = rows.reduce((s, r) => s + r.backlinks, 0);
    return [
      {
        title: 'Referring domains',
        value: rows.length,
        icon: <Link2 />,
        iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      },
      {
        title: 'Avg. strength',
        value: avgDr,
        icon: <Link2 />,
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      },
      {
        title: 'Backlinks (sum)',
        value: totalBl.toLocaleString(),
        icon: <Link2 />,
        iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      },
    ];
  }, [rows]);

  const columns: Column<BacklinkRow>[] = useMemo(
    () => [
      {
        key: 'exp',
        label: '',
        width: '40px',
        render: (row) => (
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId((id) => (id === row.id ? null : row.id));
            }}
            aria-expanded={expandedId === row.id}
            aria-label={expandedId === row.id ? 'Collapse row' : 'Expand row'}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expandedId === row.id ? 'rotate-90' : ''}`}
            />
          </button>
        ),
      },
      {
        key: 'referringDomain',
        label: 'Referring domain',
        render: (row) => <span className="font-medium text-[var(--color-text-primary)]">{row.referringDomain}</span>,
      },
      { key: 'dr', label: 'DR', render: (row) => <span className="font-mono">{row.dr}</span> },
      { key: 'ur', label: 'UR', render: (row) => <span className="font-mono">{row.ur}</span> },
      { key: 'backlinks', label: 'Links', render: (row) => row.backlinks.toLocaleString() },
      {
        key: 'anchor',
        label: 'Anchor',
        render: (row) => <span className="line-clamp-2 max-w-[200px] text-xs">{row.anchorText}</span>,
      },
    ],
    [expandedId],
  );

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status} highlight="dfs" />

        <ToolRunPanel
          onRun={run}
          onClear={() => {
            setUrl('');
            setRows([]);
            setExpandedId(null);
          }}
          onExportCsv={exportCsv}
          exportDisabled={rows.length === 0}
          runLabel="Analyze"
          running={running}
          disabled={!url.trim() || !status?.dataForSeo}
        >
          <Input
            label="Target URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
          />
          {!status?.dataForSeo && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">DATAFORSEO_LOGIN</code> and{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">DATAFORSEO_PASSWORD</code> on the API.
            </p>
          )}
        </ToolRunPanel>

        {rows.length > 0 && (
          <>
            <StatsRow items={stats} />
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/60 dark:bg-gray-800/80">
              <DataTable columns={columns} data={rows} compact />
              {expandedId ? (
                <ExpandableRowDetail
                  expanded
                  onToggle={() => setExpandedId(null)}
                  label="Subdomain breakdown (estimated from totals)"
                >
                  {(() => {
                    const row = rows.find((r) => r.id === expandedId);
                    if (!row) return null;
                    return (
                      <div className="overflow-x-auto rounded-lg border border-gray-200/80 dark:border-gray-700/60">
                        <table className="w-full min-w-[320px] text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50 text-left text-xs dark:bg-gray-800/80">
                              <th className="px-3 py-2">Host</th>
                              <th className="px-3 py-2">Links</th>
                              <th className="px-3 py-2">DR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.subdomains.map((s) => (
                              <tr key={s.host} className="border-b border-gray-100 dark:border-gray-700/50">
                                <td className="px-3 py-2 font-mono text-xs">{s.host}</td>
                                <td className="px-3 py-2">{s.links}</td>
                                <td className="px-3 py-2">{s.dr}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </ExpandableRowDetail>
              ) : null}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
