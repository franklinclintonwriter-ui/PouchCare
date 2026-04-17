import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/features/tools/registry';
import type { ToolCategory } from '@/features/tools/types';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useToolsStatus, useToolRuns } from '@/api/tools';

const BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning'> = {
  mock: 'warning',
  beta: 'default',
  soon: 'default',
  live: 'success',
};

export default function ToolsHub() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ToolCategory | 'all'>('all');
  const qc = useQueryClient();
  const { data: status, isFetching: statusLoading } = useToolsStatus();
  const { data: recentRuns } = useToolRuns(12);

  const refreshIntegrations = () => {
    void qc.invalidateQueries({ queryKey: ['tools', 'status'] });
    void qc.invalidateQueries({ queryKey: ['tools', 'runs'] });
  };

  useHeaderConfig({
    title: 'Tools',
    description: 'SEO & assets',
    breadcrumbs: [{ label: 'Tools' }],
    actions: [],
  });

  const filtered = useMemo(() => {
    return TOOLS_REGISTRY.filter((t) => {
      const matchesCat = cat === 'all' || t.category === cat;
      const needle = q.trim().toLowerCase();
      const matchesQ =
        !needle ||
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle);
      return matchesCat && matchesQ;
    });
  }, [q, cat]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-50/90 via-white to-primary-50/20 px-5 py-6 shadow-sm dark:border-gray-700/60 dark:from-gray-900/80 dark:via-gray-900/50 dark:to-primary-950/25 sm:px-7 sm:py-7">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-primary-600/70" aria-hidden />
          <p className="pl-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
            Workspace
          </p>
          <h1 className="mt-2 pl-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-3xl">
            Tools
          </h1>
          <p className="mt-2 max-w-xl pl-3 text-sm text-gray-600 dark:text-gray-400">
            SERP, authority, backlinks, keywords, favicon exports — configure providers in{' '}
            <code className="rounded bg-gray-100 px-1 font-mono text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              apps/api/.env
            </code>
            .
          </p>
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200/80 pt-4 dark:border-gray-700/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={refreshIntegrations}
                disabled={statusLoading}
                icon={<RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />}
              >
                Refresh status
              </Button>
              {status?.checkedAt && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Last check: {new Date(status.checkedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {status && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  status.serpApi
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
                SerpAPI
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  status.openPageRank
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
                Open PageRank
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  status.dataForSeo
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
                DataForSEO
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Favicon ZIP (API / Sharp)
              </span>
            </div>
          )}
        </div>

        {recentRuns && recentRuns.length > 0 && (
          <Card padding="none">
            <CardContent className="mt-0 p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent runs</p>
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700/60">
                {recentRuns.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2 text-xs first:pt-0 last:pb-0">
                    <span className="font-mono text-[10px] text-gray-400 tabular-nums">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                    <Badge variant="default" size="sm" className="uppercase">
                      {r.toolType}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{r.queryLabel}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search tools…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCat('all')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-[40px] sm:min-h-0',
                cat === 'all'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
              )}
            >
              All
            </button>
            {TOOL_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-[40px] sm:min-h-0',
                  cat === c
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} to={tool.path} className="group block min-h-[44px]">
                <Card className="h-full transition-shadow duration-200 hover:shadow-card">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={BADGE_VARIANT[tool.badge] ?? 'default'} size="sm">
                        {tool.badge}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="font-semibold text-[var(--color-text-primary)] group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {tool.title}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-3">{tool.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {tool.category}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-secondary)]">No tools match your filters.</p>
        )}
      </div>
    </PageTransition>
  );
}
