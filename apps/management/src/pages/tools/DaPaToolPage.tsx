import { useCallback, useMemo, useState } from 'react';
import { BarChart3, Download, Play, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatsRow } from '@/components/shared/StatsRow';
import { ToolDisclaimer } from '@/features/tools/components/ToolDisclaimer';
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome';
import { ToolRunPanel } from '@/features/tools/components/ToolRunPanel';
import { downloadCsv } from '@/features/tools/csv';
import { useToolHistory } from '@/features/tools/useToolHistory';
import { useDomainMetrics, useToolsStatus } from '@/api/tools';
import { toast } from 'sonner';

function normalizeDomain(raw: string): string {
  return raw.replace(/^https?:\/\//, '').split('/')[0]?.trim() ?? '';
}

type Row = { domain: string; rank: number; rankInteger: number };

export default function DaPaToolPage() {
  const [domainA, setDomainA] = useState('pouchcare.com');
  const [domainB, setDomainB] = useState('');
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [label, setLabel] = useState('');
  const { push } = useToolHistory('da-pa');
  const { data: status } = useToolsStatus();
  const mutation = useDomainMetrics();

  const clearAll = useCallback(() => {
    setDomainA('');
    setDomainB('');
    setRows([]);
    setLabel('');
  }, []);

  const run = useCallback(async () => {
    const a = normalizeDomain(domainA);
    if (!a) return;
    setRunning(true);
    setRows([]);
    try {
      const b = normalizeDomain(domainB);
      const out = await mutation.mutateAsync({ domainA: a, domainB: b || undefined });
      setRows(out.domains);
      setLabel(out.label);
      push(b ? `${a} vs ${b}` : a);
      toast.success('Open PageRank data loaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }, [domainA, domainB, mutation, push]);

  const exportCsv = useCallback(() => {
    if (!rows.length) return;
    downloadCsv(
      'open-pagerank.csv',
      ['domain', 'rank', 'rankInteger'],
      rows.map((r) => [r.domain, String(r.rank), String(r.rankInteger)]),
    );
  }, [rows]);

  const headerConfig = useMemo(
    () => ({
      title: 'Domain rank',
      description: rows.length ? `${rows.length} row(s)` : undefined,
      breadcrumbs: [{ label: 'Tools', href: '/tools' }, { label: 'Domain rank' }],
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
          label: 'Analyze',
          icon: Play,
          variant: 'primary' as const,
          disabled: !normalizeDomain(domainA) || !status?.openPageRank,
          isLoading: running,
          onClick: run,
        },
      ],
    }),
    [rows.length, exportCsv, clearAll, run, domainA, status?.openPageRank, running],
  );

  useHeaderConfig(headerConfig, [exportCsv, clearAll, run, rows.length, running, domainA, status?.openPageRank]);

  const stats = useMemo(() => {
    if (!rows.length) return [];
    const r0 = rows[0]!;
    const out = [
      {
        title: rows.length > 1 ? `Rank: ${r0.domain}` : 'Open PageRank',
        value: r0.rank.toFixed(2),
        icon: <BarChart3 />,
        iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      },
      {
        title: 'Integer',
        value: r0.rankInteger,
        icon: <BarChart3 />,
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      },
    ];
    if (rows[1]) {
      out.push({
        title: `Rank: ${rows[1].domain}`,
        value: rows[1].rank.toFixed(2),
        icon: <BarChart3 />,
        iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      });
    }
    return out;
  }, [rows]);

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'domain', label: 'Domain', render: (r) => <span className="font-medium">{r.domain}</span> },
      { key: 'rank', label: 'Rank (0–10)', render: (r) => <span className="font-mono">{r.rank.toFixed(2)}</span> },
      { key: 'ri', label: 'Integer', render: (r) => r.rankInteger },
    ],
    [],
  );

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolDisclaimer status={status} highlight="opr" compact />

        <ToolPageChrome
          accent="violet"
          eyebrow="SEO · Open PageRank"
          title="Domain authority snapshot"
          hint="Compare up to two domains on the public 0–10 scale."
        />

        <ToolRunPanel onRun={run} showActions={false} runLabel="Analyze" running={running}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Primary domain"
              value={domainA}
              onChange={(e) => setDomainA(e.target.value)}
              placeholder="example.com"
            />
            <Input
              label="Compare (optional)"
              value={domainB}
              onChange={(e) => setDomainB(e.target.value)}
              placeholder="competitor.com"
            />
          </div>
          {!status?.openPageRank && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Set <code className="rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/50">OPENPAGERANK_API_KEY</code>.
            </p>
          )}
          {label ? <p className="text-[11px] text-[var(--color-text-secondary)]">{label}</p> : null}
        </ToolRunPanel>

        {rows.length > 0 && (
          <>
            <StatsRow items={stats} columns={stats.length >= 3 ? 'grid-cols-2 lg:grid-cols-3' : undefined} />
            <DataTable columns={columns} data={rows} compact emptyTitle="No results" emptyDescription="Enter domains above." />
          </>
        )}
      </div>
    </PageTransition>
  );
}
