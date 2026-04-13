import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useLead, useUpdateLead, useDeleteLead } from '@/api/crm';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import { Pencil, Trash2, Mail, Phone, Building2, Globe, Calendar, User, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types/models';
import { CrmScopeNotice } from '@/components/crm/CrmScopeNotice';

const STAGE_OPTIONS = [
  { label: 'New', value: 'NEW' },
  { label: 'Qualified', value: 'QUALIFIED' },
  { label: 'Proposal', value: 'PROPOSAL' },
  { label: 'Negotiation', value: 'NEGOTIATION' },
  { label: 'Won', value: 'WON' },
  { label: 'Lost', value: 'LOST' },
];

const SOURCE_OPTIONS = [
  { label: 'Unknown', value: 'Unknown' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Website', value: 'Website' },
  { label: 'Cold Outreach', value: 'Cold Outreach' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Event', value: 'Event' },
  { label: 'Partner', value: 'Partner' },
];

function leadToForm(lead: Lead) {
  return {
    company: lead.company,
    contactName: lead.name,
    email: lead.email,
    phone: lead.phone,
    stage: lead.stage,
    source: lead.source,
    estimatedValue: String(lead.value),
    notes: lead.notes,
  };
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const { formatCurrency } = useCurrency();
  const { data: lead, isLoading } = useLead(id!);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const canEdit = perm.isCEO || perm.isOps || perm.isManager;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const openEdit = useCallback(() => {
    if (lead) setForm(leadToForm(lead));
    setEditOpen(true);
  }, [lead]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateLead.mutateAsync({
        id,
        company: form.company,
        contactName: form.contactName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        stage: form.stage,
        source: form.source || undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        notes: form.notes || undefined,
      });
      toast.success('Lead updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteLead.mutateAsync(id);
      toast.success('Lead deleted');
      navigate('/crm/leads');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useHeaderConfig(useMemo(() => ({
    title: lead?.name ?? 'Lead',
    breadcrumbs: [{ label: 'CRM' }, { label: 'Leads', href: '/crm/leads' }, { label: lead?.name ?? '...' }],
    actions: canEdit ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
      { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
    ] : [],
  }), [lead, canEdit, openEdit]));

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><Skeleton className="h-40 w-full rounded" /></Card>
          <Card><Skeleton className="h-40 w-full rounded" /></Card>
        </div>
      </PageTransition>
    );
  }

  if (!lead) {
    return (
      <PageTransition>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">Lead not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <CrmScopeNotice />
      {/* Header card */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={lead.name} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{lead.name}</span>
                <StatusBadge status={lead.stage} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{lead.company}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(lead.value)}</p>
            <Badge variant="info" size="sm">Deal Value</Badge>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lead.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={lead.phone} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={lead.company} />
              <InfoRow icon={<Globe className="h-4 w-4" />} label="Source" value={lead.source} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deal Information</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Value" value={formatCurrency(lead.value)} />
              <InfoRow icon={<Tag className="h-4 w-4" />} label="Stage" value={<StatusBadge status={lead.stage} />} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Assignee" value={
                <div className="flex items-center gap-2">
                  <Avatar name={lead.assigneeName} src={lead.assigneeAvatar} size="xs" />
                  <span>{lead.assigneeName}</span>
                </div>
              } />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Last Contact" value={lead.lastContactDate} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={lead.createdAt} />
            </div>
          </CardContent>
        </Card>
      </div>

      {lead.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Lead"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button isLoading={updateLead.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Contact Name" value={form.contactName ?? ''} onChange={set('contactName')} />
            <Input label="Company" value={form.company ?? ''} onChange={set('company')} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email ?? ''} onChange={set('email')} />
            <Input label="Phone" value={form.phone ?? ''} onChange={set('phone')} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select label="Stage" options={STAGE_OPTIONS} value={form.stage ?? 'NEW'} onChange={set('stage')} />
            <Select label="Source" options={SOURCE_OPTIONS} value={form.source ?? 'Unknown'} onChange={set('source')} />
          </div>
          <Input label="Estimated Value (USD)" type="number" min="0" value={form.estimatedValue ?? ''} onChange={set('estimatedValue')} />
          <Textarea label="Notes" value={form.notes ?? ''} onChange={set('notes')} rows={3} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLead.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <div className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}
