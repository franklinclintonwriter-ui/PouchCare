import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Shield } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { useAdminAudit, type AuditEntry } from '@/api/admin-audit'
import { PageTransition } from '@/components/ui/PageTransition'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const KIND_OPTIONS = [
  { value: '', label: 'All resources' },
  { value: 'PortalMember', label: 'PortalMember' },
  { value: 'PortalOrder', label: 'PortalOrder' },
  { value: 'SalesOrder', label: 'SalesOrder' },
  { value: 'ApkJob', label: 'ApkJob' },
  { value: 'ClientAccount', label: 'ClientAccount' },
  { value: 'Service', label: 'Service' },
]

export default function AuditLog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const action = searchParams.get('action') ?? ''
  const resourceKind = searchParams.get('resourceKind') ?? ''
  const since = searchParams.get('since') ?? ''
  const until = searchParams.get('until') ?? ''
  const [actionInput, setActionInput] = useState(action)

  const { data, isLoading } = useAdminAudit({
    page,
    limit: 25,
    action: action || undefined,
    resourceKind: resourceKind || undefined,
    since: since || undefined,
    until: until || undefined,
  })

  const setParam = (k: string, v: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (!v) next.delete(k)
    else next.set(k, v)
    if (k !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useHeaderConfig(useMemo(() => ({
    title: 'Audit Log',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Settings' }, { label: 'Audit Log' }],
  }), []))

  const columns: Column<AuditEntry>[] = [
    {
      key: 'createdAt', label: 'When',
      render: (r) => <span className="font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'actorRole', label: 'Actor',
      render: (r) => (
        <div>
          <div className="text-sm font-medium">{r.actorRole ?? '—'}</div>
          <div className="font-mono text-xs text-gray-500">{r.actorId?.slice(0, 8) ?? ''}</div>
        </div>
      ),
    },
    { key: 'action', label: 'Action', render: (r) => <span className="font-mono text-xs">{r.action}</span> },
    {
      key: 'resourceKind', label: 'Resource',
      render: (r) => (
        <div>
          <div className="text-sm">{r.resourceKind}</div>
          <div className="font-mono text-xs text-gray-400">{r.resourceId.slice(0, 12)}…</div>
        </div>
      ),
    },
    { key: 'ip', label: 'IP', render: (r) => <span className="font-mono text-xs text-gray-500">{r.ip ?? '—'}</span> },
  ]

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <SearchInput
            value={actionInput}
            onChange={setActionInput}
            onSearch={() => setParam('action', actionInput || undefined)}
            placeholder="Action contains… e.g. order.refund"
            className="min-w-[260px]"
          />
          <Select
            value={resourceKind}
            onChange={(e) => setParam('resourceKind', e.target.value || undefined)}
            options={KIND_OPTIONS}
            placeholder="Resource"
            className="w-[180px]"
          />
          <input
            type="date"
            value={since}
            onChange={(e) => setParam('since', e.target.value || undefined)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="date"
            value={until}
            onChange={(e) => setParam('until', e.target.value || undefined)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open('/v1/admin/audit/export.csv', '_blank')}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <DataTable<AuditEntry>
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          emptyIcon={<Shield className="h-10 w-10 text-gray-300" />}
          emptyTitle="No audit entries"
          emptyDescription="Try clearing filters."
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
