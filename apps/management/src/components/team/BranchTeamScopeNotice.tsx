import { Info } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

/** Branch managers see payroll, attendance, leave, and daily reports only for their branch (API-enforced). */
export function BranchTeamScopeNotice() {
  const { isBranchManager } = usePermission();
  if (!isBranchManager) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-sky-200/90 bg-sky-50/95 px-4 py-3 text-sm text-sky-950 shadow-sm dark:border-sky-900/45 dark:bg-sky-950/30 dark:text-sky-50/95"
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold text-sky-900 dark:text-sky-100">Branch view.</span>{' '}
          Lists and actions here are limited to people in your branch. CEO, Co-MD, Ops, and HR see
          company-wide data.
        </p>
      </div>
    </div>
  );
}
