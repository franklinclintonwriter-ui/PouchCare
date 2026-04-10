import { Info } from 'lucide-react';
import type { ToolsStatus } from '@/api/tools';

interface ToolDisclaimerProps {
  /** When provided, shows which backend integrations are configured (from GET /v1/tools/status). */
  status?: ToolsStatus | undefined;
  /** Highlight a specific provider line (e.g. current page). */
  highlight?: 'serp' | 'opr' | 'dfs';
}

/**
 * Live data from third-party APIs (SerpAPI, Open PageRank, DataForSEO).
 * Configure keys in apps/api/.env — see apps/api/.env.example.
 *
 * Future: optional `tools.access` permission when auditing is required.
 */
export function ToolDisclaimer({ status, highlight }: ToolDisclaimerProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100">
        <Info className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        <p>
          <span className="font-semibold">Live tools.</span> Results come from external providers configured on the API
          server. Usage is logged for accountability.
        </p>
      </div>
      {status && (
        <ul className="flex flex-wrap gap-2 text-xs">
          <li
            className={`rounded-full px-2.5 py-1 font-medium ${
              highlight === 'serp'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            SerpAPI (SERP): {status.serpApi ? 'configured' : 'not set'}
          </li>
          <li
            className={`rounded-full px-2.5 py-1 font-medium ${
              highlight === 'opr'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Open PageRank: {status.openPageRank ? 'configured' : 'not set'}
          </li>
          <li
            className={`rounded-full px-2.5 py-1 font-medium ${
              highlight === 'dfs'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            DataForSEO: {status.dataForSeo ? 'configured' : 'not set'}
          </li>
        </ul>
      )}
    </div>
  );
}
