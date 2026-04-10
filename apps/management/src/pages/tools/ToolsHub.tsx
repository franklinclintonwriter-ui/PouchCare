import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/features/tools/registry';
import type { ToolCategory } from '@/features/tools/types';
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
  const { data: status } = useToolsStatus();
  const { data: recentRuns } = useToolRuns(12);

  useHeaderConfig({
    title: 'Tools',
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
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            SEO &amp; web tools
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
            Live integrations: SerpAPI (SERP), Open PageRank (domain rank), DataForSEO (backlinks &amp; keywords), and
            server-side favicon ZIPs. Configure API keys in <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">apps/api/.env</code>.
          </p>
          {status && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-1 font-medium ${status.serpApi ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}
              >
                SerpAPI: {status.serpApi ? 'on' : 'off'}
              </span>
              <span
                className={`rounded-full px-2 py-1 font-medium ${status.openPageRank ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}
              >
                Open PageRank: {status.openPageRank ? 'on' : 'off'}
              </span>
              <span
                className={`rounded-full px-2 py-1 font-medium ${status.dataForSeo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}
              >
                DataForSEO: {status.dataForSeo ? 'on' : 'off'}
              </span>
            </div>
          )}
        </div>

        {recentRuns && recentRuns.length > 0 && (
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 text-sm dark:border-gray-700/60 dark:bg-gray-800/80">
            <p className="mb-2 font-medium text-[var(--color-text-primary)]">Recent runs</p>
            <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
              {recentRuns.slice(0, 8).map((r) => (
                <li key={r.id} className="flex flex-wrap gap-2">
                  <span className="font-mono text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                  <span className="rounded bg-gray-100 px-1.5 dark:bg-gray-700">{r.toolType}</span>
                  <span className="min-w-0 truncate">{r.queryLabel}</span>
                </li>
              ))}
            </ul>
          </div>
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
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {tool.category}
                    </span>
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
