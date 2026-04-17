import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const ACCENT = {
  emerald: 'border-l-emerald-500 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/25 dark:via-gray-900/40 dark:to-gray-900/20',
  violet: 'border-l-violet-500 bg-gradient-to-br from-violet-50/40 via-white to-white dark:from-violet-950/25 dark:via-gray-900/40 dark:to-gray-900/20',
  amber: 'border-l-amber-500 bg-gradient-to-br from-amber-50/40 via-white to-white dark:from-amber-950/25 dark:via-gray-900/40 dark:to-gray-900/20',
  sky: 'border-l-sky-500 bg-gradient-to-br from-sky-50/40 via-white to-white dark:from-sky-950/25 dark:via-gray-900/40 dark:to-gray-900/20',
  rose: 'border-l-rose-500 bg-gradient-to-br from-rose-50/40 via-white to-white dark:from-rose-950/25 dark:via-gray-900/40 dark:to-gray-900/20',
  slate: 'border-l-slate-500 bg-gradient-to-br from-slate-50/50 via-white to-white dark:from-slate-900/40 dark:via-gray-900/40 dark:to-gray-900/20',
} as const;

export type ToolChromeAccent = keyof typeof ACCENT;

interface ToolPageChromeProps {
  accent: ToolChromeAccent;
  /** Short category label (e.g. SEO, Assets). */
  eyebrow: string;
  /** Primary page title. */
  title: string;
  /** Optional one-line context (keep very short). */
  hint?: string;
  className?: string;
}

/**
 * Minimal tool page hero: breadcrumb, title, subtle accent — replaces long intros.
 */
export function ToolPageChrome({ accent, eyebrow, title, hint, className }: ToolPageChromeProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm dark:border-gray-700/60',
        'border-l-4',
        ACCENT[accent],
        className,
      )}
    >
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Link
            to="/tools"
            className="inline-flex items-center gap-0.5 text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Tools
            <ChevronRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
          <span className="text-gray-400 dark:text-gray-600">{eyebrow}</span>
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">{title}</h1>
        {hint ? (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
