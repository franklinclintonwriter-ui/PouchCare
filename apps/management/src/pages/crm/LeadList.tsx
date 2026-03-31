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
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/mocks/generators';
import { Users, Target, DollarSign, GitBranch, Plus } from 'lucide-react';
import type { Lead } from '@/types/models';
import { toast } from 'sonner';

export default function LeadList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
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
      <StatsRow
        loading={isLoading}
        items={[
          { title: 'Total Leads', value: stats.total, icon: <Users className="h-4 w-4" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
          { title: 'Qualified %', value: `${stats.qualifiedPct}%`, icon: <Target className="h-4 w-4" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Pipeline Value', value: formatCurrency(stats.pipelineValue), icon: <DollarSign className="h-4 w-4" />, iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
        ]}
      />

      <DataTable<Lead>
        columns={columns}
        data={leads}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/crm/leads/${row.id}`)}
        getRowId={(row) => row.id}
      />

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
                    stage: 'NEW',
                  });
                  toast.success('Lead created');
                  setOpenCreate(false);
                  setCompany('');
                  setContactName('');
                  setEmail('');
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
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input label="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </Modal>
    </PageTransition>
  );
}
