/**
 * Web Portfolio — unified Domain + Website management page.
 * Each domain card shows domain profile, linked website metrics, and full SEO data.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, AlertTriangle, Plus, Pencil, Trash2, Search, X,
  RefreshCw, SortAsc, SortDesc, LayoutGrid, List,
  Shield, CheckCircle, Clock, ExternalLink,
  BarChart3, Zap, Tag, Globe2,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import {
  useDomains, useDomainNiches, useDomainStats,
  useCreateDomain, useUpdateDomain, useDeleteDomain,
  useCreateWebsite,
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
import { formatCompact } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

// ── Constants ─────────────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 12;
const TABLE_PER_PAGE = 25;

const STATUS_OPTIONS = [
  { value: 'all',        label: 'All Statuses' },
  { value: 'Active',     label: '● Active' },
  { value: 'Expired',    label: '⚠ Expired' },
  { value: 'Redemption', label: '🔒 Redemption' },
  { value: 'Hold',       label: '⏸ Hold' },
];

const SORT_OPTIONS = [
  { value: 'expiry',    label: 'Expiry Date' },
  { value: 'name',      label: 'Domain Name' },
  { value: 'da',        label: 'DA Score' },
  { value: 'dr',        label: 'DR Score' },
  { value: 'traffic',   label: 'Traffic' },
  { value: 'backlinks', label: 'Backlinks' },
  { value: 'age',       label: 'Domain Age' },
];

const emptyDomainForm = {
  domainName: '', registrar: '', expiryDate: '', dnsProvider: '',
  annualCost: '', status: 'Active', niche: '',
};
const emptyWebForm = {
  name: '', url: '', hostedOn: '', domainLinked: '', status: 'live', monthlyTraffic: '',
};

// ── Colour helpers ─────────────────────────────────────────────────────────────
const NICHE_MAP: Record<string, string> = {
  'Gaming':            'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40',
  'PouchCare':         'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700/40',
  'App / Mobile':      'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/40',
  'Digital Marketing': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/40',
  'Finance':           'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
  'Media / News':      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
  'E-Commerce':        'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/40',
};
const nicheColor = (n?: string | null) => NICHE_MAP[n ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

function cardBorder(domain: Domain): string {
  const s = (domain.status ?? '').toLowerCase();
  if (s.includes('expir') || s.includes('hold') || s.includes('redeem')) return 'border-red-200 dark:border-red-800/50';
  if ((domain as any).linkedWebsite) return 'border-emerald-200 dark:border-emerald-800/40';
  return 'border-amber-200 dark:border-amber-800/40';
}

function statusDot(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'live')                                 return 'bg-emerald-500';
  if (s.includes('expir') || s.includes('hold') || s.includes('down')) return 'bg-red-500';
  if (s.includes('redeem') || s === 'staging')                       return 'bg-amber-500';
  return 'bg-gray-400';
}

function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / 86400000);
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Score pill ────────────────────────────────────────────────────────────────
function ScorePill({ label, value, className = '' }: { label: string; value?: number | null; className?: string }) {
  if (value == null) return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="text-base font-bold text-gray-300 dark:text-gray-600">—</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
    </div>
  );
  const color = value >= 50 ? 'text-emerald-600 dark:text-emerald-400'
              : value >= 20 ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400';
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className={cn('text-base font-extrabold tabular-nums', color)}>{value}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
    </div>
  );
}

// ── Domain Card ───────────────────────────────────────────────────────────────
interface CardProps { domain: Domain; canManage: boolean; onEdit: (d: Domain) => void; onDelete: (d: Domain) => void; onAddWebsite: (d: Domain) => void; }

function DomainCard({ domain, canManage, onEdit, onDelete, onAddWebsite }: CardProps) {
  const nav      = useNavigate();
  const days     = daysUntil(domain.expiryDate);
  const isExpired  = days != null && days <= 0;
  const isExpiring = days != null && days > 0 && days <= 30;
  const linked   = (domain as any).linkedWebsite as null | {
    id: string; name: string; url?: string; status: string; platform?: string; cms?: string;
    monthlyTraffic?: number; uptimePercent?: number; avgLoadTime?: number;
    adsenseConnected?: boolean; adsenseEarnings?: number; sslStatus?: string; hostedOn?: string;
  };

  const lifecycle = domain.lifecycleStatus ?? 'INCOMPLETE';
  const lifecycleW = lifecycle === 'COMPLETED' ? 100 : lifecycle === 'IN_PROGRESS' ? 55 : 15;
  const lifecycleColor = lifecycle === 'COMPLETED' ? 'bg-emerald-500'
                       : lifecycle === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900',
        cardBorder(domain),
      )}
    >
      {/* Top gradient accent */}
      <div className={cn(
        'h-0.5 w-full',
        isExpired ? 'bg-red-500' : isExpiring ? 'bg-amber-400' : linked ? 'bg-gradient-to-r from-emerald-400 to-primary-500' : 'bg-gradient-to-r from-amber-400 to-orange-400',
      )} />

      <div className="flex flex-col gap-4 p-4">
        {/* ── Row 1: niche + status + actions ─────────────────────────────── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {(domain as any).niche && (
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', nicheColor((domain as any).niche))}>
                <Tag className="h-2.5 w-2.5" />{(domain as any).niche}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(domain.status))} />
              {domain.status ?? 'Unknown'}
            </span>
            {domain.sslStatus === 'Active' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Shield className="h-2.5 w-2.5" />SSL
              </span>
            )}
            {domain.searchConsoleVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-400">
                <CheckCircle className="h-2.5 w-2.5" />GSC
              </span>
            )}
            {domain.adsenseConnected && (
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 dark:border-yellow-700/40 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Zap className="h-2.5 w-2.5" />AdSense
              </span>
            )}
          </div>
          {canManage && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={(e) => { e.stopPropagation(); onEdit(domain); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200" title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(domain); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Row 2: domain name ───────────────────────────────────────────── */}
        <div
          className="cursor-pointer"
          onClick={() => nav(`/assets/domains/${domain.id}`)}
        >
          <p className="truncate text-lg font-extrabold tracking-tight text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400">
            {domain.domain}
          </p>
          {domain.expiryDate && (
            <p className={cn('mt-0.5 text-xs font-medium', isExpired ? 'text-red-600 dark:text-red-400' : isExpiring ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500')}>
              {isExpired
                ? `Expired ${Math.abs(days!)} days ago`
                : days != null && days <= 90
                  ? `Expires in ${days} days · ${fmtDate(domain.expiryDate)}`
                  : `Expires ${fmtDate(domain.expiryDate)}`}
            </p>
          )}
        </div>

        {/* ── Row 3: Domain + Website panels ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Domain panel */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Globe className="h-3 w-3" />Domain
            </p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-1">
                <dt className="text-gray-400">Registrar</dt>
                <dd className="truncate font-medium text-gray-700 dark:text-gray-300">{domain.registrar ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-1">
                <dt className="text-gray-400">Registered</dt>
                <dd className="font-medium text-gray-700 dark:text-gray-300">{fmtDate((domain as any).registrationDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-1">
                <dt className="text-gray-400">Age</dt>
                <dd className="font-medium text-gray-700 dark:text-gray-300">
                  {(domain as any).domainAgeYears != null ? `${(domain as any).domainAgeYears} yrs` : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-1">
                <dt className="text-gray-400">Auto-renew</dt>
                <dd className={cn('font-bold', domain.autoRenew ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                  {domain.autoRenew ? '✓ On' : '✗ Off'}
                </dd>
              </div>
              {domain.nameservers && (
                <div className="flex items-center justify-between gap-1">
                  <dt className="text-gray-400">NS</dt>
                  <dd className="truncate font-mono text-[10px] text-gray-500">{domain.nameservers.split(',')[0]}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Website panel */}
          {linked ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/10">
              <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <Globe2 className="h-3 w-3" />Website
              </p>
              <div className="mb-1.5 flex items-center gap-1">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDot(linked.status))} />
                <span className="truncate text-xs font-bold text-gray-900 dark:text-gray-100">{linked.name}</span>
                {linked.url && (
                  <a href={linked.url.startsWith('http') ? linked.url : `https://${linked.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="ml-auto shrink-0 text-gray-400 hover:text-primary-500">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <dl className="space-y-1.5 text-xs">
                {linked.platform && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-400">Platform</dt>
                    <dd className="font-medium text-gray-700 dark:text-gray-300">{linked.platform}{linked.cms ? ` / ${linked.cms}` : ''}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-gray-400">Traffic</dt>
                  <dd className="font-medium text-gray-700 dark:text-gray-300">{linked.monthlyTraffic ? `${formatCompact(linked.monthlyTraffic)}/mo` : '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-400">Uptime</dt>
                  <dd className={cn('font-bold', (linked.uptimePercent ?? 0) >= 99 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600')}>
                    {linked.uptimePercent != null ? `${linked.uptimePercent}%` : '—'}
                  </dd>
                </div>
                {linked.avgLoadTime != null && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-400">Load time</dt>
                    <dd className={cn('font-bold', linked.avgLoadTime < 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600')}>
                      {linked.avgLoadTime.toFixed(2)}s
                    </dd>
                  </div>
                )}
                {linked.hostedOn && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-400">Hosted</dt>
                    <dd className="truncate font-medium text-gray-600 dark:text-gray-400">{linked.hostedOn}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 text-center dark:border-gray-700 dark:bg-gray-800/30">
              <Globe2 className="mb-1.5 h-5 w-5 text-gray-300 dark:text-gray-600" />
              <p className="text-[10px] font-medium text-gray-400">No website linked</p>
              {canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddWebsite(domain); }}
                  className="mt-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-600 transition-colors hover:bg-primary-100 dark:border-primary-700/40 dark:bg-primary-900/20 dark:text-primary-400"
                >
                  + Add website
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Row 4: SEO metrics ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/40 p-3 dark:border-gray-800 dark:from-gray-800/50 dark:to-gray-800/30">
          <p className="mb-2.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <BarChart3 className="h-3 w-3" />SEO Metrics
          </p>
          <div className="flex items-center justify-around gap-2 text-center">
            <ScorePill label="DA" value={domain.daScore} />
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <ScorePill label="DR" value={domain.drScore} />
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold tabular-nums text-gray-700 dark:text-gray-300">
                {domain.backlinksCount != null ? formatCompact(domain.backlinksCount) : '—'}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Links</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold tabular-nums text-gray-700 dark:text-gray-300">
                {domain.indexedPages != null ? formatCompact(domain.indexedPages) : '—'}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Pages</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold tabular-nums text-gray-700 dark:text-gray-300">
                {domain.monthlyTraffic != null ? formatCompact(domain.monthlyTraffic) : '—'}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Traffic</span>
            </div>
          </div>
        </div>

        {/* ── Row 5: Lifecycle progress ────────────────────────────────────── */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lifecycle</span>
            <span className={cn('text-[10px] font-bold', lifecycle === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : lifecycle === 'IN_PROGRESS' ? 'text-amber-600' : 'text-gray-400')}>
              {lifecycle === 'COMPLETED' ? '✅ Complete' : lifecycle === 'IN_PROGRESS' ? '⚡ In Progress' : '○ Incomplete'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={cn('h-full rounded-full transition-all duration-700', lifecycleColor)} style={{ width: `${lifecycleW}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function Domains() {
  const navigate  = useNavigate();
  useCurrency(); // keep hook for future cost display
  const perm      = usePermission();
  const canManage = perm.isCEO || perm.isOps;

  // ── View mode (persisted) ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => (localStorage.getItem('portfolio-view') as any) ?? 'cards');
  const switchView = (m: 'cards' | 'table') => { setViewMode(m); localStorage.setItem('portfolio-view', m); setPage(1); };

  // ── Filters ────────────────────────────────────────────────────────────────
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('all');
  const [niche,     setNiche]     = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy,    setSortBy]    = useState<DomainFilters['sortBy']>('expiry');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');

  const limit = viewMode === 'cards' ? CARDS_PER_PAGE : TABLE_PER_PAGE;

  const filters: DomainFilters = useMemo(() => ({
    page, limit,
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(niche  !== 'all' ? { niche }  : {}),
    ...(activeTag        ? { tag: activeTag } : {}),
    sortBy, sortDir,
  }), [page, limit, search, status, niche, activeTag, sortBy, sortDir]);

  const resetPage = useCallback((fn: () => void) => { fn(); setPage(1); }, []);

  const { data, isLoading, isFetching } = useDomains(filters);
  const { data: niches = [] }           = useDomainNiches();
  const { data: stats }                 = useDomainStats();

  const domains    = data?.data  ?? [];
  const meta       = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createDomain  = useCreateDomain();
  const updateDomain  = useUpdateDomain();
  const deleteDomain  = useDeleteDomain();
  const createWebsite = useCreateWebsite();

  const [domainModal,  setDomainModal]  = useState(false);
  const [webModal,     setWebModal]     = useState(false);
  const [editDomain,   setEditDomain]   = useState<Domain | null>(null);
  const [domainForm,   setDomainForm]   = useState(emptyDomainForm);
  const [webForm,      setWebForm]      = useState(emptyWebForm);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

  const openCreate    = () => { setEditDomain(null); setDomainForm(emptyDomainForm); setDomainModal(true); };
  const openAddWeb    = (d: Domain) => { setWebForm({ ...emptyWebForm, domainLinked: d.domain }); setWebModal(true); };
  const openEdit      = (d: Domain) => {
    setEditDomain(d);
    setDomainForm({ domainName: d.domain, registrar: d.registrar ?? '', expiryDate: d.expiryDate?.slice(0, 10) ?? '', dnsProvider: d.dnsProvider ?? '', annualCost: String(d.annualCost ?? ''), status: d.status ?? 'Active', niche: (d as any).niche ?? '' });
    setDomainModal(true);
  };

  const handleSaveDomain = async () => {
    if (!domainForm.domainName.trim()) return toast.error('Domain name required');
    try {
      const payload = { domainName: domainForm.domainName.trim(), registrar: domainForm.registrar || undefined, expiryDate: domainForm.expiryDate || undefined, hostingServer: domainForm.dnsProvider || undefined, annualRenewalCost: domainForm.annualCost ? Number(domainForm.annualCost) : undefined, status: domainForm.status, niche: domainForm.niche || undefined };
      editDomain ? await updateDomain.mutateAsync({ id: editDomain.id, ...payload }) : await createDomain.mutateAsync(payload);
      toast.success(editDomain ? 'Domain updated' : 'Domain added');
      setDomainModal(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
  };

  const handleSaveWebsite = async () => {
    if (!webForm.name.trim()) return toast.error('Website name required');
    try {
      await createWebsite.mutateAsync({ name: webForm.name, url: webForm.url || undefined, hostedOn: webForm.hostedOn || undefined, domainLinked: webForm.domainLinked || undefined, status: webForm.status, monthlyTraffic: webForm.monthlyTraffic ? Number(webForm.monthlyTraffic) : undefined });
      toast.success('Website added');
      setWebModal(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDomain.mutateAsync(deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Delete failed'); }
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerConfig = useMemo(() => ({
    title: 'Web Portfolio',
    breadcrumbs: [{ label: 'Assets', href: '/assets' }, { label: 'Web Portfolio', icon: Globe }],
    actions: canManage ? [
      { type: 'button' as const, label: 'Add Domain', icon: Plus, onClick: openCreate },
    ] : [],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [canManage]);
  useHeaderConfig(headerConfig);

  // ── Expiry alert ───────────────────────────────────────────────────────────
  const expiringDomains = domains.filter((d) => { const x = daysUntil(d.expiryDate); return x != null && x > 0 && x < 30; });

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: Column<Domain>[] = [
    {
      key: 'domain', label: 'Domain', sticky: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{r.domain}</p>
          {(r as any).niche && <span className={cn('mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', nicheColor((r as any).niche))}><Tag className="h-2.5 w-2.5" />{(r as any).niche}</span>}
        </div>
      ),
    },
    { key: 'registrar', label: 'Registrar', render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{r.registrar}</span> },
    {
      key: 'expiryDate', label: 'Expiry',
      render: (r) => {
        const d = daysUntil(r.expiryDate);
        const cls = d != null && d <= 0 ? 'text-red-600 dark:text-red-400 font-bold' : d != null && d < 30 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-400';
        return <span className={cn('text-sm', cls)}>{fmtDate(r.expiryDate)}{d != null && d <= 30 && d > 0 && <span className="ml-1 text-[10px]">({d}d)</span>}</span>;
      },
    },
    { key: 'status', label: 'Status', render: (r) => <span className="flex items-center gap-1.5 text-xs font-medium"><span className={cn('h-1.5 w-1.5 rounded-full', statusDot(r.status))} />{r.status}</span> },
    { key: 'daScore' as any, label: 'DA', align: 'center' as any, render: (r) => <span className="font-bold text-sm">{r.daScore ?? '—'}</span> },
    { key: 'drScore' as any, label: 'DR', align: 'center' as any, render: (r) => <span className="font-bold text-sm">{r.drScore ?? '—'}</span> },
    { key: 'backlinksCount' as any, label: 'Backlinks', align: 'right' as any, render: (r) => <span className="text-sm tabular-nums">{r.backlinksCount != null ? formatCompact(r.backlinksCount) : '—'}</span> },
    { key: 'monthlyTraffic' as any, label: 'Traffic', align: 'right' as any, render: (r) => <span className="text-sm tabular-nums">{r.monthlyTraffic != null ? formatCompact(r.monthlyTraffic) : '—'}</span> },
    ...(canManage ? [{
      key: 'actions' as keyof Domain, label: '', align: 'right' as const,
      render: (r: Domain) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    }] : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageTransition className="space-y-4">

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total Domains',   value: stats?.total ?? '—',        icon: Globe,    color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/40' },
          { label: 'Total Websites',  value: stats?.totalWebsites ?? '—', icon: Globe2,   color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Expiring ≤30d',   value: stats?.expiringSoon ?? '—',  icon: Clock,    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Expired',         value: stats?.expired ?? '—',       icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-950/40' },
          { label: 'Complete',        value: stats?.completed ?? '—',     icon: CheckCircle,   color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 p-3 sm:p-4">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
              <p className="truncate text-xs text-gray-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Expiry alert ───────────────────────────────────────────────────── */}
      {expiringDomains.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {expiringDomains.length} domain{expiringDomains.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="truncate text-xs text-amber-600 dark:text-amber-400">
                {expiringDomains.map((d) => d.domain).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search domains, registrar, category…" value={search} onChange={(e) => resetPage(() => setSearch(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            {search && <button onClick={() => resetPage(() => setSearch(''))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* Status */}
            <select value={status} onChange={(e) => resetPage(() => setStatus(e.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={(e) => resetPage(() => setSortBy(e.target.value as any))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => resetPage(() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc'))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              {sortDir === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>

            {/* View toggle */}
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <button onClick={() => switchView('cards')} className={cn('flex h-9 w-9 items-center justify-center transition-colors', viewMode === 'cards' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800')}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => switchView('table')} className={cn('flex h-9 w-9 items-center justify-center transition-colors', viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800')}><List className="h-4 w-4" /></button>
            </div>

            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />}
          </div>
        </div>
      </Card>

      {/* ── Category tabs ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => resetPage(() => setNiche('all'))}
          className={cn('rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all', niche === 'all' ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950/40 dark:text-primary-300' : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400')}>
          All {meta && <span className="ml-1 opacity-60">({meta.total})</span>}
        </button>
        {niches.map(({ niche: n, count }) => (
          <button key={n} onClick={() => resetPage(() => setNiche(niche === n ? 'all' : n))}
            className={cn('rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all', niche === n ? nicheColor(n) : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400')}>
            {n} <span className="ml-1 opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* ── Active tag ─────────────────────────────────────────────────────── */}
      {activeTag && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2 dark:border-primary-800 dark:bg-primary-950/30">
          <Tag className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Tag: <strong>{activeTag}</strong></span>
          <button onClick={() => resetPage(() => setActiveTag(null))} className="ml-auto rounded p-0.5 text-primary-400 hover:text-primary-600"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Cards view ─────────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <Card className="py-16 text-center">
            <Globe className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="font-medium text-gray-500">No domains found</p>
            <p className="mt-1 text-sm text-gray-400">{search || niche !== 'all' ? 'Try changing your filters.' : 'Import domains using the importer scripts.'}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {domains.map((d) => (
              <DomainCard key={d.id} domain={d} canManage={canManage} onEdit={openEdit} onDelete={setDeleteTarget} onAddWebsite={openAddWeb} />
            ))}
          </div>
        )
      )}

      {/* ── Table view ─────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <DataTable columns={columns} data={domains} isLoading={isLoading} getRowId={(r) => r.id}
          emptyTitle="No domains found" emptyDescription="Try changing your filters."
          onRowClick={(r) => navigate(`/assets/domains/${r.id}`)} />
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && totalPages > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} total={meta.total} onPageChange={setPage} />
      )}

      {/* ── Domain modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={domainModal} onClose={() => setDomainModal(false)} title={editDomain ? 'Edit Domain' : 'Add Domain'}
        footer={<><Button variant="outline" size="sm" onClick={() => setDomainModal(false)}>Cancel</Button><Button size="sm" isLoading={createDomain.isPending || updateDomain.isPending} onClick={handleSaveDomain}>{editDomain ? 'Update' : 'Add'}</Button></>}>
        <div className="space-y-3">
          <Input label="Domain Name" placeholder="example.com" value={domainForm.domainName} onChange={(e) => setDomainForm(f => ({ ...f, domainName: e.target.value }))} />
          <Input label="Registrar" placeholder="GoDaddy, Cloudflare…" value={domainForm.registrar} onChange={(e) => setDomainForm(f => ({ ...f, registrar: e.target.value }))} />
          <Input type="date" label="Expiry Date" value={domainForm.expiryDate} onChange={(e) => setDomainForm(f => ({ ...f, expiryDate: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category / Niche</label>
            <select value={domainForm.niche} onChange={(e) => setDomainForm(f => ({ ...f, niche: e.target.value }))}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">— Select category —</option>
              {['PouchCare','Gaming','App / Mobile','Digital Marketing','Finance','Media / News','E-Commerce','Other'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <Input label="DNS / Hosting" placeholder="Cloudflare, cPanel…" value={domainForm.dnsProvider} onChange={(e) => setDomainForm(f => ({ ...f, dnsProvider: e.target.value }))} />
          <Input type="number" label="Annual Cost (USD)" placeholder="12.99" value={domainForm.annualCost} onChange={(e) => setDomainForm(f => ({ ...f, annualCost: e.target.value }))} />
        </div>
      </Modal>

      {/* ── Website modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={webModal} onClose={() => setWebModal(false)} title="Add Website"
        footer={<><Button variant="outline" size="sm" onClick={() => setWebModal(false)}>Cancel</Button><Button size="sm" isLoading={createWebsite.isPending} onClick={handleSaveWebsite}>Add</Button></>}>
        <div className="space-y-3">
          <Input label="Website Name" placeholder="My Site" value={webForm.name} onChange={(e) => setWebForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="URL" placeholder="https://example.com" value={webForm.url} onChange={(e) => setWebForm(f => ({ ...f, url: e.target.value }))} />
          <Input label="Linked Domain" value={webForm.domainLinked} onChange={(e) => setWebForm(f => ({ ...f, domainLinked: e.target.value }))} />
          <Input label="Hosted On" placeholder="Cloudflare Pages, cPanel…" value={webForm.hostedOn} onChange={(e) => setWebForm(f => ({ ...f, hostedOn: e.target.value }))} />
          <Input type="number" label="Monthly Traffic" placeholder="5000" value={webForm.monthlyTraffic} onChange={(e) => setWebForm(f => ({ ...f, monthlyTraffic: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Domain"
        message={`Delete "${deleteTarget?.domain}"? This cannot be undone.`} confirmLabel="Delete" variant="danger"
        isLoading={deleteDomain.isPending} onConfirm={handleDelete} />
    </PageTransition>
  );
}
