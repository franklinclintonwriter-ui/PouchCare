/**
 * Staff dashboard — PouchCare internal domain portfolio.
 * Features: pagination, category tabs, tag cloud, search, sort, status filter.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, AlertTriangle, Plus, Pencil, Trash2,
  Search, X, RefreshCw, SortAsc, SortDesc,
  CheckCircle, Tag,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import {
  useDomains, useDomainNiches, useCreateDomain,
  useUpdateDomain, useDeleteDomain,
  type DomainFilters,
} from '@/api/assets';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageTransition } from '@/components/ui/PageTransition';
import { Pagination } from '@/components/ui/Pagination';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermission } from '@/hooks/usePermission';
import type { Domain } from '@/types/models';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 25;
const emptyForm = {
  domainName: '', registrar: '', expiryDate: '', dnsProvider: '',
  annualCost: '', status: 'Active', niche: '',
};

const STATUS_OPTIONS = [
  { value: 'all',        label: 'All Statuses' },
  { value: 'Active',     label: 'Active' },
  { value: 'Expired',    label: 'Expired' },
  { value: 'Redemption', label: 'Redemption' },
  { value: 'Hold',       label: 'Hold' },
];

const SORT_OPTIONS = [
  { value: 'expiry', label: 'Expiry Date' },
  { value: 'name',   label: 'Domain Name' },
  { value: 'status', label: 'Status' },
  { value: 'niche',  label: 'Category' },
];

// ── Status colour helpers ──────────────────────────────────────────────────────
function statusDot(status: string) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active')                            return 'bg-emerald-500';
  if (s === 'expired' || s.includes('expired'))  return 'bg-red-500';
  if (s.includes('redeem') || s.includes('hold')) return 'bg-amber-500';
  return 'bg-gray-400';
}

// ── Niche colour mapping ───────────────────────────────────────────────────────
const NICHE_COLORS: Record<string, string> = {
  'Gaming':            'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40',
  'PouchCare':         'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700/40',
  'App / Mobile':      'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/40',
  'Digital Marketing': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/40',
  'Finance':           'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
  'Media / News':      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
  'E-Commerce':        'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/40',
  'Other':             'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};
function nicheColor(niche?: string | null) {
  return NICHE_COLORS[niche ?? 'Other'] ?? NICHE_COLORS['Other'];
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Domains() {
  const navigate     = useNavigate();
  const { formatCurrency } = useCurrency();
  const perm         = usePermission();
  const canManage    = perm.isCEO || perm.isOps;

  // ── Filter state ────────────────────────────────────────────────────────────
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('all');
  const [niche,    setNiche]    = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy,   setSortBy]   = useState<DomainFilters['sortBy']>('expiry');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');

  // Build filter object
  const filters: DomainFilters = useMemo(() => ({
    page, limit: PAGE_SIZE,
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(niche  !== 'all' ? { niche }  : {}),
    ...(activeTag        ? { tag: activeTag } : {}),
    sortBy, sortDir,
  }), [page, search, status, niche, activeTag, sortBy, sortDir]);

  const { data, isLoading, isFetching } = useDomains(filters);
  const { data: niches = [] }           = useDomainNiches();

  const domains   = data?.data  ?? [];
  const meta      = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // Reset page on filter change
  const applyFilter = useCallback((fn: () => void) => { fn(); setPage(1); }, []);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editRow,      setEditRow]      = useState<Domain | null>(null);
  const [form,         setForm]         = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

  const openCreate = () => { setEditRow(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit   = (row: Domain) => {
    setEditRow(row);
    setForm({
      domainName:  row.domain,
      registrar:   row.registrar ?? '',
      expiryDate:  row.expiryDate ? row.expiryDate.slice(0, 10) : '',
      dnsProvider: row.dnsProvider ?? '',
      annualCost:  String(row.annualCost ?? ''),
      status:      row.status ?? 'Active',
      niche:       (row as any).niche ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.domainName.trim()) return toast.error('Domain name is required');
    const payload = {
      domainName:        form.domainName.trim(),
      registrar:         form.registrar   || undefined,
      expiryDate:        form.expiryDate  || undefined,
      hostingServer:     form.dnsProvider || undefined,
      annualRenewalCost: form.annualCost  ? Number(form.annualCost) : undefined,
      status:            form.status      || 'Active',
      niche:             form.niche       || undefined,
    };
    try {
      if (editRow) {
        await updateDomain.mutateAsync({ id: editRow.id, ...payload });
        toast.success('Domain updated');
      } else {
        await createDomain.mutateAsync(payload);
        toast.success('Domain added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDomain.mutateAsync(deleteTarget.id);
      toast.success('Domain deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  const headerConfig = useMemo(() => ({
    title: 'Domains',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Domains', icon: Globe },
    ],
    actions: canManage
      ? [{ type: 'button' as const, label: 'Add Domain', icon: Plus, onClick: openCreate }]
      : [],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canManage]);
  useHeaderConfig(headerConfig);

  // ── Expiry helpers ───────────────────────────────────────────────────────────
  const now = new Date();
  const expiringDomains = domains.filter((d) => {
    if (!d.expiryDate) return false;
    const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  });

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: Column<Domain>[] = [
    {
      key:    'domain',
      label:  'Domain',
      sticky: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{row.domain}</p>
          {(row as any).niche && (
            <span className={cn('mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', nicheColor((row as any).niche))}>
              <Tag className="h-2.5 w-2.5" />{(row as any).niche}
            </span>
          )}
        </div>
      ),
    },
    { key: 'registrar', label: 'Registrar', render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{r.registrar}</span> },
    {
      key:   'expiryDate',
      label: 'Expiry',
      render: (row) => {
        if (!row.expiryDate) return <span className="text-gray-400">—</span>;
        const diff = (new Date(row.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const isExpiring = diff > 0 && diff < 30;
        const isExpired  = diff <= 0;
        return (
          <span className={cn('text-sm font-medium', isExpired ? 'text-red-600 dark:text-red-400' : isExpiring ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300')}>
            {row.expiryDate.slice(0, 10)}
            {isExpiring && <span className="ml-1 text-[10px] font-bold">(soon)</span>}
            {isExpired  && <span className="ml-1 text-[10px] font-bold">(expired)</span>}
          </span>
        );
      },
    },
    {
      key:    'autoRenew',
      label:  'Auto',
      align:  'center',
      render: (row) => (
        <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full', row.autoRenew ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
          {row.autoRenew
            ? <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            : <X          className="h-3 w-3 text-red-500 dark:text-red-400" />}
        </span>
      ),
    },
    {
      key:   'status',
      label: 'Status',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
          <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(row.status ?? ''))} />
          {row.status}
        </span>
      ),
    },
    { key: 'dnsProvider', label: 'DNS', render: (r) => <span className="text-xs text-gray-500 dark:text-gray-400">{r.dnsProvider !== 'Unknown' ? r.dnsProvider : '—'}</span> },
    {
      key:   'annualCost',
      label: 'Cost/yr',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {row.annualCost ? formatCurrency(row.annualCost) : '—'}
        </span>
      ),
    },
    ...(canManage ? [{
      key:   'actions' as keyof Domain,
      label: '',
      align: 'right' as const,
      render: (row: Domain) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageTransition className="space-y-4">

      {/* Expiry alert */}
      {expiringDomains.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {expiringDomains.length} domain{expiringDomains.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                {expiringDomains.map((d) => d.domain).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Search + filter bar ─────────────────────────────────────────────── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains, registrar, category…"
              value={search}
              onChange={(e) => applyFilter(() => setSearch(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            {search && (
              <button onClick={() => applyFilter(() => setSearch(''))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Status filter */}
            <select
              value={status}
              onChange={(e) => applyFilter(() => setStatus(e.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => applyFilter(() => setSortBy(e.target.value as DomainFilters['sortBy']))}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => applyFilter(() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc'))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {sortDir === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
            </div>

            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />}
          </div>
        </div>
      </Card>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => applyFilter(() => setNiche('all'))}
          className={cn(
            'rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all',
            niche === 'all'
              ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950/40 dark:text-primary-300'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
          )}
        >
          All {meta && <span className="ml-1 opacity-60">({meta.total})</span>}
        </button>
        {niches.map(({ niche: n, count }) => (
          <button
            key={n}
            onClick={() => applyFilter(() => setNiche(niche === n ? 'all' : n))}
            className={cn(
              'rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all',
              niche === n
                ? nicheColor(n) + ' border-opacity-60'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            {n} <span className="ml-1 opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* ── Active tag filter strip ──────────────────────────────────────────── */}
      {activeTag && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2 dark:border-primary-800 dark:bg-primary-950/30">
          <Tag className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Tag: <strong>{activeTag}</strong></span>
          <button onClick={() => applyFilter(() => setActiveTag(null))} className="ml-auto rounded p-0.5 text-primary-400 hover:text-primary-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Domain table ────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={domains}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No domains found"
        emptyDescription={search || niche !== 'all' || activeTag ? 'Try changing your filters.' : 'Import domains using the Cloudflare or registrar importer scripts.'}
        onRowClick={(row) => navigate(`/assets/domains/${row.id}`)}
      />

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {meta && totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      )}

      {/* ── Add / Edit modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Domain' : 'Add Domain'}
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={createDomain.isPending || updateDomain.isPending} onClick={handleSave}>
              {editRow ? 'Update' : 'Add'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Domain Name" placeholder="example.com" value={form.domainName} onChange={(e) => setForm(f => ({ ...f, domainName: e.target.value }))} />
          <Input label="Registrar" placeholder="GoDaddy, Namecheap, Cloudflare…" value={form.registrar} onChange={(e) => setForm(f => ({ ...f, registrar: e.target.value }))} />
          <Input type="date" label="Expiry Date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category / Niche</label>
            <select
              value={form.niche}
              onChange={(e) => setForm(f => ({ ...f, niche: e.target.value }))}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">— Select category —</option>
              <option value="PouchCare">PouchCare</option>
              <option value="Gaming">Gaming</option>
              <option value="App / Mobile">App / Mobile</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Media / News">Media / News</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input label="DNS / Hosting Server" placeholder="Cloudflare, cPanel…" value={form.dnsProvider} onChange={(e) => setForm(f => ({ ...f, dnsProvider: e.target.value }))} />
          <Input type="number" label="Annual Cost (USD)" placeholder="12.99" value={form.annualCost} onChange={(e) => setForm(f => ({ ...f, annualCost: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Domain"
        message={`Delete "${deleteTarget?.domain}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteDomain.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
