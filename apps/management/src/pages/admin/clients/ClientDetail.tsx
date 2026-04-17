import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Wallet, Pencil, Mail, Phone, GitMerge } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminClient,
  useAdjustWallet,
  useUpdateAdminClient,
  useMergeClients,
  useAdminClients,
  useClientActivity,
} from '@/api/admin-clients'
import { useClientAssets } from '@/api/admin-assets'
import { PageTransition } from '@/components/ui/PageTransition'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useCurrency } from '@/hooks/useCurrency'
import { usePermission } from '@/hooks/usePermission'

const TABS = ['Overview', 'Orders', 'Wallet', 'Assets', 'Tickets', 'Activity'] as const
type Tab = typeof TABS[number]

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useAdminClient(id)
  const adjustWallet = useAdjustWallet()
  const updateClient = useUpdateAdminClient()
  const mergeClients = useMergeClients()
  const { formatCurrency } = useCurrency()
  const perm = usePermission()
  const canAdjustWallet = perm.isCEO || perm.isOps
  const canEdit = perm.isManager
  const canMerge = perm.isCEO

  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeTarget, setMergeTarget] = useState<{ id: string; fullName: string; email: string } | null>(null)
  const mergeResults = useAdminClients({ q: mergeSearch || undefined, limit: 6 })
  const activity = useClientActivity(id, { limit: 25 })
  const assets = useClientAssets(id)

  const handleMerge = async () => {
    if (!mergeTarget) return
    if (mergeTarget.id === id) {
      toast.error('Pick a different client to merge into')
      return
    }
    try {
      const res = await mergeClients.mutateAsync({ sourceId: id!, intoId: mergeTarget.id })
      toast.success(`Merged into ${mergeTarget.fullName} · revertible until ${new Date(res.revertibleUntil).toLocaleDateString()}`)
      setMergeOpen(false)
      setMergeTarget(null)
      setMergeSearch('')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Merge failed')
    }
  }

  const [tab, setTab] = useState<Tab>('Overview')
  const [walletOpen, setWalletOpen] = useState(false)
  const [walletForm, setWalletForm] = useState({ deltaUsd: '', reason: 'REFUND_MANUAL', note: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '', phone: '', whatsapp: '', country: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CHURNED',
    assignedManager: '',
  })

  const openEdit = () => {
    if (!data) return
    setEditForm({
      fullName: data.fullName ?? '',
      phone: data.phone ?? '',
      whatsapp: data.whatsapp ?? '',
      country: data.country ?? '',
      status: data.status,
      assignedManager: data.assignedManager ?? '',
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editForm.fullName.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      await updateClient.mutateAsync({
        id: id!,
        patch: {
          fullName: editForm.fullName.trim(),
          phone: editForm.phone || undefined,
          whatsapp: editForm.whatsapp || undefined,
          country: editForm.country || undefined,
          status: editForm.status,
          assignedManager: editForm.assignedManager || undefined,
        },
      })
      toast.success('Client updated')
      setEditOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Update failed')
    }
  }

  useHeaderConfig(useMemo(() => ({
    title: data?.fullName ?? 'Client',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Clients', href: '/admin/clients' }, { label: data?.fullName ?? '…' }],
  }), [data?.fullName]))

  const handleAdjust = async () => {
    const delta = Number(walletForm.deltaUsd)
    if (!Number.isFinite(delta) || delta === 0) {
      toast.error('Enter a non-zero amount')
      return
    }
    try {
      const res = await adjustWallet.mutateAsync({
        id: id!,
        deltaUsd: delta,
        reason: walletForm.reason,
        note: walletForm.note || undefined,
        idempotencyKey: `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      })
      toast.success(`Wallet now ${formatCurrency(res.walletBalance)}`)
      setWalletOpen(false)
      setWalletForm({ deltaUsd: '', reason: 'REFUND_MANUAL', note: '' })
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Wallet adjust failed')
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </PageTransition>
    )
  }

  if (!data) {
    return (
      <PageTransition>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Client not found.</div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Link to="/admin/clients" className="mb-3 inline-flex items-center text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to clients
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {data.fullName?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{data.fullName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {data.email}</span>
                  {data.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.phone}</span>}
                  {data.country && <span>· {data.country}</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="success" size="sm">{data.status}</Badge>
                  {data.referralCode && <Badge variant="default" size="sm">Ref: {data.referralCode}</Badge>}
                  {data.assignedManager && <Badge variant="default" size="sm">Mgr: {data.assignedManager}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canAdjustWallet && data.portalMemberId && (
                <Button size="sm" variant="ghost" onClick={() => setWalletOpen(true)}>
                  <Wallet className="mr-1.5 h-4 w-4" /> Adjust wallet
                </Button>
              )}
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={openEdit}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit
                </Button>
              )}
              {canMerge && (
                <Button size="sm" variant="ghost" onClick={() => setMergeOpen(true)}>
                  <GitMerge className="mr-1.5 h-4 w-4" /> Merge
                </Button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Lifetime spend" value={formatCurrency(data.totalSpentUsd)} />
            <Stat label="Orders" value={String(data.totalOrders)} />
            <Stat label="Wallet" value={formatCurrency(data.walletBalance)} />
            <Stat label="Joined" value={new Date(data.createdAt).toLocaleDateString()} />
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'Overview' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="Contact">
                  <Field label="Email" value={data.email} />
                  <Field label="Phone" value={data.phone || '—'} />
                  <Field label="WhatsApp" value={data.whatsapp || '—'} />
                  <Field label="Country" value={data.country || '—'} />
                </Section>
                <Section title="Account">
                  <Field label="Status" value={data.status} />
                  <Field label="Manager" value={data.assignedManager || '—'} />
                  <Field label="Source" value={data.source || '—'} />
                  <Field label="Referral code" value={data.referralCode || '—'} />
                </Section>
              </div>
            )}

            {tab === 'Orders' && (
              <div className="space-y-2">
                {(data.orders ?? []).length === 0 && (
                  <div className="text-sm text-gray-400">No orders yet.</div>
                )}
                {(data.orders ?? []).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                    <div>
                      <span className="font-mono text-xs text-gray-400">PO-{String(o.orderId ?? '').padStart(4, '0')}</span>
                      <span className="ml-2 font-medium">{o.service}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default" size="sm">{o.status}</Badge>
                      <span className="font-mono">{formatCurrency(o.amountUsd ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'Wallet' && (
              <div className="space-y-2">
                {(data.walletTx ?? []).length === 0 && <div className="text-sm text-gray-400">No transactions yet.</div>}
                {(data.walletTx ?? []).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                    <div>
                      <div className="font-medium">{t.type}</div>
                      <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`font-mono ${t.amountUsd >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.amountUsd >= 0 ? '+' : ''}{formatCurrency(t.amountUsd)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'Assets' && (
              <div className="space-y-4">
                {assets.isLoading && <div className="text-sm text-gray-400">Loading assets…</div>}
                {assets.data && (
                  <>
                    <Section title={`Websites (${assets.data.websites.length})`}>
                      {assets.data.websites.length === 0 && <div className="text-sm text-gray-400">None</div>}
                      {assets.data.websites.map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                          <div>
                            <div className="font-medium">{w.name}</div>
                            {w.url && <div className="text-xs text-gray-500">{w.url}</div>}
                          </div>
                          <Badge variant={w.status === 'Live' ? 'success' : 'default'} size="sm">{w.status ?? '—'}</Badge>
                        </div>
                      ))}
                    </Section>
                    <Section title={`Domains (${assets.data.domains.length})`}>
                      {assets.data.domains.length === 0 && <div className="text-sm text-gray-400">None</div>}
                      {assets.data.domains.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                          <div>
                            <div className="font-medium">{d.domainName}</div>
                            <div className="text-xs text-gray-500">
                              {d.registrar ?? '—'}
                              {d.expiryDate && ` · expires ${new Date(d.expiryDate).toLocaleDateString()}`}
                            </div>
                          </div>
                          <Badge variant={d.status === 'Active' ? 'success' : 'default'} size="sm">{d.status ?? '—'}</Badge>
                        </div>
                      ))}
                    </Section>
                  </>
                )}
              </div>
            )}

            {tab === 'Tickets' && (
              <div className="space-y-2">
                {(data.tickets ?? []).length === 0 && <div className="text-sm text-gray-400">No tickets.</div>}
                {(data.tickets ?? []).map((t: any) => (
                  <div key={t.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.subject ?? t.title ?? 'Ticket'}</span>
                      <Badge variant="default" size="sm">{t.status ?? '—'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'Activity' && (
              <div className="space-y-2">
                {activity.isLoading && <div className="text-sm text-gray-400">Loading activity…</div>}
                {!activity.isLoading && (activity.data?.data ?? []).length === 0 && (
                  <div className="text-sm text-gray-400">No activity yet.</div>
                )}
                {(activity.data?.data ?? []).map((e: any) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                    <div className="min-w-0">
                      <div className="font-medium">{e.action}</div>
                      <div className="text-xs text-gray-500">
                        {e.resourceKind} · {e.resourceId.slice(0, 12)}…
                        {e.actorRole && <span className="ml-2 text-gray-400">by {e.actorRole}</span>}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit client modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit client">
        <div className="space-y-3">
          <Input
            label="Full name"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="WhatsApp"
              value={editForm.whatsapp}
              onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
            />
          </div>
          <Input
            label="Country"
            value={editForm.country}
            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CHURNED">Churned</option>
            </select>
          </div>
          <Input
            label="Assigned manager"
            value={editForm.assignedManager}
            onChange={(e) => setEditForm({ ...editForm, assignedManager: e.target.value })}
            placeholder="Manager name or email"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleEditSave} disabled={updateClient.isPending}>
              {updateClient.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Merge clients modal */}
      <Modal isOpen={mergeOpen} onClose={() => setMergeOpen(false)} title={`Merge ${data.fullName} into…`}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            The current client becomes the source; the chosen target survives. The merge is auditable
            and revertible for 7 days.
          </p>
          <Input
            label="Search target client"
            value={mergeSearch}
            onChange={(e) => setMergeSearch(e.target.value)}
            placeholder="name or email"
          />
          <div className="max-h-64 divide-y divide-gray-100 overflow-auto rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {(mergeResults.data?.data ?? []).filter((c) => c.id !== id).map((c) => (
              <button
                key={c.id}
                onClick={() => setMergeTarget({ id: c.id, fullName: c.fullName, email: c.email })}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  mergeTarget?.id === c.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div>
                  <div className="font-medium">{c.fullName}</div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </div>
                <Badge variant="default" size="sm">{c.status}</Badge>
              </button>
            ))}
            {(mergeResults.data?.data ?? []).length === 0 && (
              <div className="p-3 text-sm text-gray-400">No matches.</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMergeOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleMerge}
              disabled={!mergeTarget || mergeClients.isPending}
            >
              {mergeClients.isPending ? 'Merging…' : 'Merge'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Wallet adjust modal */}
      <Modal isOpen={walletOpen} onClose={() => setWalletOpen(false)} title="Adjust wallet">
        <div className="space-y-3">
          <Input
            label="Amount (USD; negative to debit)"
            value={walletForm.deltaUsd}
            onChange={(e) => setWalletForm({ ...walletForm, deltaUsd: e.target.value })}
            placeholder="e.g. -25 or 50"
            type="number"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Reason</label>
            <select
              value={walletForm.reason}
              onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="REFUND_MANUAL">Manual refund</option>
              <option value="GOODWILL_CREDIT">Goodwill credit</option>
              <option value="CORRECTION">Balance correction</option>
              <option value="PROMO">Promo / bonus</option>
            </select>
          </div>
          <Input
            label="Note (optional)"
            value={walletForm.note}
            onChange={(e) => setWalletForm({ ...walletForm, note: e.target.value })}
            placeholder="Audit-visible context"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setWalletOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdjust} disabled={adjustWallet.isPending}>
              {adjustWallet.isPending ? 'Adjusting…' : 'Adjust wallet'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )
}
