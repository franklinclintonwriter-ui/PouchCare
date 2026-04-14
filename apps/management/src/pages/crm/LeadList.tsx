import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateLead, useLeads } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { StatsRow } from '@/components/shared/StatsRow';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import { Users, Target, DollarSign, GitBranch, Plus, LayoutGrid, Table2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Lead } from '@/types/models';
import { toast } from 'sonner';
import { CrmScopeNotice } from '@/components/crm/CrmScopeNotice';

type ViewMode = 'table' | 'cards';

export default function LeadList() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const createLead = useCreateLead();

  const { data, isLoading } = useLeads({ q: search, status, page, limit: 20 });
  const leads = data?.data ?? [];
  const meta = data?.meta;

  const { data: allData } = useLeads({});
  const allLeads = allData?.data ?? [];

  const stats = useMemo(() => {
    const total = allLeads.length;
    const qualified = allLeads.filter(l => l.stage !== 'NEW' && l.stage !== 'LOST').length;
    const qualifiedPct = total > 0 ? Math.round((qualified / total) * 100) : 0;
    const pipelineValue = allLeads.filter(l => l.stage !== 'LOST' && l.stage !== 'WON').reduce((s, l) => s + l.value, 0);
    return { total, qualifiedPct, pipelineValue };
  }, [allLeads]);

  useHeaderConfig({
    title: 'Leads',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Leads' }],
    actions: [
      {
        type: 'toggle' as const,
        value: viewMode,
        onChange: (v: string) => setViewMode(v === 'cards' ? 'cards' : 'table'),
        options: [
          { value: 'table', label: 'Table', icon: Table2 },
          { value: 'cards', label: 'Cards', icon: LayoutGrid },
        ],
      },
      { type: 'button', label: 'New Lead', icon: Plus, onClick: () => setOpenCreate(true) },
      { type: 'search', placeholder: 'Search leads...', value: search, onChange: setSearch },
      {
        type: 'filter', label: 'Stage', icon: GitBranch, value: status, onChange: setStatus,
        options: [
          { label: 'All Stages', value: '' },
          { label: 'New', value: 'NEW' },
          { label: 'Qualified', value: 'QUALIFIED' },
          { label: 'Proposal', value: 'PROPOSAL' },
          { label: 'Negotiation', value: 'NEGOTIATION' },
          { label: 'Won', value: 'WON' },
          { label: 'Lost', value: 'LOST' },
        ],
      },
    ],
  });

  const columns: Column<Lead>[] = [
    { key: 'name', label: 'Name', sticky: true, render: (row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
    )},
    { key: 'company', label: 'Company' },
    { key: 'stage', label: 'Stage', render: (row) => <StatusBadge status={row.stage} /> },
    { key: 'value', label: 'Value', align: 'right', render: (row) => (
      <span className="font-medium">{formatCurrency(row.value)}</span>
    )},
    { key: 'assigneeName', label: 'Assignee', render: (row) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.assigneeName} src={row.assigneeAvatar} size="xs" />
        <span className="text-sm">{row.assigneeName}</span>
      </div>
    )},
    { key: 'source', label: 'Source' },
    { key: 'lastContactDate', label: 'Last Contact' },
  ];

  return (
    <PageTransition className="space-y-6">
      <CrmScopeNotice />
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Leads', value: stats.total, icon: <Users className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Qualified %', value: `${stats.qualifiedPct}%`, icon: <Target className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Pipeline Value', value: formatCurrency(stats.pipelineValue), icon: <DollarSign className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
        ]}
      />

      {viewMode === 'table' ? (
        <DataTable<Lead>
          columns={columns}
          data={leads}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/crm/leads/${row.id}`)}
          getRowId={(row) => row.id}
          emptyTitle="No leads found"
          emptyDescription="Create your first lead to start tracking prospects."
        />
      ) : (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
          {isLoading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="No leads found"
              description="Create your first lead to start tracking prospects."
              className="py-12"
            />
          ) : (
            <>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {leads.map((lead) => (
                  <Card
                    key={lead.id}
                    hover
                    padding="md"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    className="min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {lead.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {lead.company}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={lead.stage} size="sm" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrency(lead.value)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-700/60">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={lead.assigneeName} src={lead.assigneeAvatar} size="xs" />
                        <span className="truncate text-gray-600 dark:text-gray-300">
                          {lead.assigneeName}
                        </span>
                      </div>
                      <span className="shrink-0 text-gray-500 dark:text-gray-400">
                        {lead.source}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {meta && meta.totalPages > 0 ? (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700/60 lg:px-5">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create Lead"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createLead.isPending}
              onClick={async () => {
                if (!company.trim()) return toast.error('Company is required');
                try {
                  await createLead.mutateAsync({
                    company: company.trim(),
                    contactName: contactName || undefined,
                    email: email || undefined,
                    phone: phone || undefined,
                    source: source || undefined,
                    estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
                    stage: 'NEW',
                  });
                  toast.success('Lead created');
                  setOpenCreate(false);
                  setCompany('');
                  setContactName('');
                  setEmail('');
                  setPhone('');
                  setSource('');
                  setEstimatedValue('');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Create failed');
                }
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Select
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              options={[
                { label: '— Select —', value: '' },
                { label: 'Website', value: 'Website' },
                { label: 'Referral', value: 'Referral' },
                { label: 'Social Media', value: 'Social Media' },
                { label: 'Cold Call', value: 'Cold Call' },
                { label: 'Email Campaign', value: 'Email Campaign' },
                { label: 'Other', value: 'Other' },
              ]}
            />
          </div>
          <Input type="number" min="0" step="0.01" label="Estimated Value (USD)" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}
