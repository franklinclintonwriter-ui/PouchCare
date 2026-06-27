import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Users, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminClients,
  useClientSegments,
  useSaveClientSegment,
  useDeleteClientSegment,
  type UnifiedClient,
  type UnifiedClientStatus,
} from '@/api/admin-clients'
import { usePermission } from '@/hooks/usePermission'
import { PageTransition } from '@/components/ui/PageTransition'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCurrency } from '@/hooks/useCurrency'

const STATUS_OPTIONS: { value: UnifiedClientStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'CHURNED', label: 'Churned' },
]

/**
 * Shareable saved segments — encoded as URL params, not server state.
 * Pasting any of these URLs reproduces the exact filter set on a
 * teammate's screen. Add new presets by appending to this array.
 */
const SEGMENTS: { label: string; params: Record<string, string> }[] = [
  { label: 'All', params: {} },
  { label: 'Active', params: { status: 'ACTIVE' } },
  { label: 'Pending verification', params: { status: 'PENDING' } },
  { label: 'Suspended', params: { status: 'SUSPENDED' } },
  { label: 'Bangladesh', params: { country: 'BD' } },
]

function statusVariant(s: UnifiedClientStatus) {
  switch (s) {
    case 'ACTIVE': return 'success' as const
    case 'PENDING': return 'warning' as const
    case 'SUSPENDED': return 'danger' as const
    case 'CHURNED': return 'default' as const
  }
}

export default function ClientsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { formatCurrency } = useCurrency()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as UnifiedClientStatus | '' | null) ?? ''
  const country = searchParams.get('country') ?? ''

  const [searchInput, setSearchInput] = useState(q)

  const perm = usePermission()
  const canWriteSegments = perm.isManager
  const savedSegments = useClientSegments()
  const saveSegment = useSaveClientSegment()
  const deleteSegment = useDeleteClientSegment()

  const { data, isLoading } = useAdminClients({
    page,
    limit: 20,
    q: q || undefined,
    status: status || undefined,
    country: country || undefined,
  })

  const setParam = (k: string, v: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (!v) next.delete(k)
    else next.set(k, v)
    if (k !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useHeaderConfig(useMemo(() => ({
    title: 'Clients',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Clients' }],
  }), []))

  const rows = data?.data ?? []

  const columns: Column<UnifiedClient>[] = [
    {
      key: 'fullName',
      label: 'Client',
      sticky: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {r.fullName?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-gray-100">{r.fullName}</div>
            <div className="truncate text-xs text-gray-500">{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'country', label: 'Country', render: (r) => <span>{r.country || '—'}</span> },
    { key: 'totalOrders', label: 'Orders', align: 'right', render: (r) => <span className="font-medium">{r.totalOrders}</span> },
    { key: 'totalSpentUsd', label: 'Spent', align: 'right', render: (r) => <span className="font-medium">{formatCurrency(r.totalSpentUsd)}</span> },
    { key: 'walletBalance', label: 'Wallet', align: 'right', render: (r) => <span>{formatCurrency(r.walletBalance)}</span> },
    {
      key: 'status', label: 'Status', render: (r) => (
        <Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge>
      ),
    },
    {
      key: 'lastOrderDate', label: 'Last order',
      render: (r) => <span className="text-sm text-gray-500">{r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : '—'}</span>,
    },
  ]

  // Merge hardcoded presets with persisted ClientSegment rows. Dedup by name
  // (persisted wins so teams can override a preset by saving the same name).
  const allSegments = useMemo(() => {
    const persisted = (savedSegments.data ?? []).map((s) => ({
      label: s.name,
      params: (s.params ?? {}) as Record<string, string>,
      id: s.id,
      persisted: true as const,
    }))
    const hardcoded = SEGMENTS.filter(
      (s) => !persisted.find((p) => p.label.toLowerCase() === s.label.toLowerCase()),
    ).map((s) => ({ ...s, persisted: false as const, id: undefined as string | undefined }))
    return [...hardcoded, ...persisted]
  }, [savedSegments.data])

  // A segment is "active" when its params exactly match current URL params
  const activeSegment = allSegments.find((s) => {
    const want = s.params ?? {}
    const haveStatus = status ?? ''
    const haveCountry = country ?? ''
    return (want.status ?? '') === haveStatus && (want.country ?? '') === haveCountry
  })

  const applySegment = (segParams: Record<string, string>) => {
    const next = new URLSearchParams()
    Object.entries(segParams).forEach(([k, v]) => v && next.set(k, v))
    if (q) next.set('q', q)
    setSearchParams(next, { replace: true })
  }

  const currentFilterParams = useMemo(() => {
    const out: Record<string, string> = {}
    if (status) out.status = status
    if (country) out.country = country
    return out
  }, [status, country])

  const hasCurrentFilters = Object.keys(currentFilterParams).length > 0

  const handleSaveSegment = async () => {
    const name = window.prompt('Segment name (e.g. "VIP UAE", "Needs follow-up")')
    if (!name) return
    try {
      await saveSegment.mutateAsync({ name: name.trim(), params: currentFilterParams })
      toast.success(`Segment "${name.trim()}" saved`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Save failed')
    }
  }

  const handleDeleteSegment = async (id: string, name: string) => {
    if (!window.confirm(`Delete segment "${name}"?`)) return
    try {
      await deleteSegment.mutateAsync(id)
      toast.success('Segment deleted')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Delete failed')
    }
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Saved segments (hardcoded presets + persisted ClientSegment rows) */}
        <div className="flex flex-wrap items-center gap-2">
          {allSegments.map((s) => {
            const isActive = activeSegment?.label === s.label
            return (
              <span key={s.label} className="inline-flex items-center">
                <button
                  onClick={() => applySegment(s.params ?? {})}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                  title={s.persisted ? 'Team-saved segment' : 'Built-in preset'}
                >
                  {s.persisted && <span className="mr-1 text-amber-500">★</span>}
                  {s.label}
                </button>
                {s.persisted && s.id && canWriteSegments && (
                  <button
                    onClick={() => handleDeleteSegment(s.id!, s.label)}
                    className="ml-1 rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                    aria-label={`Delete segment ${s.label}`}
                    title="Delete segment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
          {canWriteSegments && hasCurrentFilters && !activeSegment?.persisted && (
            <button
              onClick={handleSaveSegment}
              disabled={saveSegment.isPending}
              className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:text-gray-400"
              title="Save current filter set as a shared segment"
            >
              <Save className="mr-1 h-3 w-3" /> Save as segment
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => setParam('q', searchInput || undefined)}
            placeholder="Search name, email, referral…"
            className="min-w-[260px]"
          />
          <Select
            value={status}
            onChange={(e) => setParam('status', e.target.value || undefined)}
            options={STATUS_OPTIONS}
            placeholder="Status"
            className="w-[160px]"
          />
          <input
            value={country}
            onChange={(e) => setParam('country', e.target.value || undefined)}
            placeholder="Country"
            className="h-9 w-[140px] rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open('/v1/admin/clients/export.csv', '_blank')}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <DataTable<UnifiedClient>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyIcon={<Users className="h-10 w-10 text-gray-300" />}
          emptyTitle="No clients match"
          emptyDescription="Try clearing filters or expanding the search."
          onRowClick={(r) => navigate(`/admin/clients/${r.id}`)}
          pagination={data?.meta ? {
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            totalPages: data.meta.totalPages,
          } : undefined}
          onPageChange={(p) => setParam('page', String(p))}
        />
      </div>
    </PageTransition>
  )
}
