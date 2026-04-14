import { Info } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

/**
 * Explains branch-scoped CRM data for Branch Managers (API aligns via `crmScope`).
 */
export function CrmScopeNotice() {
  const { isBranchManager } = usePermission();
  if (!isBranchManager) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-900/45 dark:bg-amber-950/35 dark:text-amber-50/95"
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold text-amber-900 dark:text-amber-100">Branch view.</span>{' '}
          Leads and pipeline include only records you own or are assigned to. Sales orders are limited to your
          branch (or orders assigned to you). Operations and HR roles see company-wide CRM data.
        </p>
      </div>
    </div>
  );
}
