import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useLeadsByStage } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import type { Lead } from '@/types/models';
import type { LeadStage } from '@/types/enums';

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'NEW', label: 'New', color: 'bg-gray-100 dark:bg-gray-700/60' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'WON', label: 'Won', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-50 dark:bg-red-900/20' },
];

const STAGE_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'danger'> = {
  NEW: 'default',
  QUALIFIED: 'info',
  PROPOSAL: 'primary',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
};

export default function Pipeline() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: grouped, isLoading } = useLeadsByStage();

  useHeaderConfig({
    title: 'Pipeline',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Pipeline' }],
  });

  return (
    <PageTransition>
      <div className="overflow-x-auto pb-4 -mx-1">
        <div className="inline-grid grid-cols-6 gap-3 min-w-[900px] px-1" style={{ gridTemplateColumns: 'repeat(6, minmax(170px, 1fr))' }}>
          {STAGES.map((stage) => {
            const leads = grouped?.[stage.key] ?? [];
            const totalValue = leads.reduce((s, l) => s + l.value, 0);

            return (
              <div key={stage.key} className="flex flex-col gap-2">
                {/* Column header */}
                <div className={`rounded-lg p-3 ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      {stage.label}
                    </span>
                    <Badge variant={STAGE_BADGE_VARIANT[stage.key]} size="sm">{leads.length}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(totalValue)}
                  </p>
                </div>

                {/* Lead cards */}
                <div className="space-y-2 min-h-[100px]">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700/60 dark:bg-gray-800/80">
                        <Skeleton className="h-4 w-24 rounded mb-2" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    ))
                  ) : leads.length === 0 ? (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-8 dark:border-gray-700">
                      <span className="text-xs text-gray-400 dark:text-gray-500">No leads</span>
                    </div>
                  ) : (
                    leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => navigate(`/crm/leads/${lead.id}`)} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { formatCurrency } = useCurrency();
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-200/80 bg-white p-3 text-left shadow-soft transition-all duration-150 hover:shadow-elevated hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700/60 dark:bg-gray-800/80"
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{lead.name}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{lead.company}</p>
      <div className="mt-2">
        <Badge variant="success" size="sm">{formatCurrency(lead.value)}</Badge>
      </div>
    </button>
  );
}
