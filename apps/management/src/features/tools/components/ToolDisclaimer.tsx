import { Info } from 'lucide-react';
import type { ToolsStatus } from '@/api/tools';

interface ToolDisclaimerProps {
  /** When provided, shows which backend integrations are configured (from GET /v1/tools/status). */
  status?: ToolsStatus | undefined;
  /** Highlight a specific provider line (e.g. current page). */
  highlight?: 'serp' | 'opr' | 'dfs';
  /** Single-row status chips instead of the info panel. */
  compact?: boolean;
}

function ProviderChips({ status, highlight }: { status: ToolsStatus; highlight?: ToolDisclaimerProps['highlight'] }) {
  return (
    <ul className="flex flex-wrap gap-1.5 text-[11px]">
      <li
        className={`rounded-full px-2.5 py-1 font-medium ${
          highlight === 'serp'
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        SerpAPI: {status.serpApi ? 'ready' : '—'}
      </li>
      <li
        className={`rounded-full px-2.5 py-1 font-medium ${
          highlight === 'opr'
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        Open PageRank: {status.openPageRank ? 'ready' : '—'}
      </li>
      <li
        className={`rounded-full px-2.5 py-1 font-medium ${
          highlight === 'dfs'
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        DataForSEO: {status.dataForSeo ? 'ready' : '—'}
      </li>
    </ul>
  );
}

/**
 * Live data from third-party APIs (SerpAPI, Open PageRank, DataForSEO).
 * Configure keys in apps/api/.env — see apps/api/.env.example.
 */
export function ToolDisclaimer({ status, highlight, compact }: ToolDisclaimerProps) {
  if (compact) {
    if (!status) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Providers</span>
        <ProviderChips status={status} highlight={highlight} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100">
        <Info className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        <div>
          <p className="font-semibold text-sky-950 dark:text-sky-50">Connected data sources</p>
          <p className="mt-1 text-sky-900/90 dark:text-sky-100/90">
            Results are fetched live from providers you configure on the API. Requests may incur provider usage; runs are
            logged for audit trails.
          </p>
        </div>
      </div>
      {status && <ProviderChips status={status} highlight={highlight} />}
    </div>
  );
}
