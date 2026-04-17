import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Star, ExternalLink, Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminService,
  useUpdateAdminService,
  useServicePerformance,
  useServicePlans,
  useCreateServicePlan,
  useUpdateServicePlan,
  useDeleteServicePlan,
  type AdminServiceRow,
  type ServicePlan,
} from '@/api/admin-services'
import { PageTransition } from '@/components/ui/PageTransition'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCurrency } from '@/hooks/useCurrency'
import { usePermission } from '@/hooks/usePermission'

const TABS = ['Basics', 'Pricing', 'Plans', 'SEO', 'Visibility', 'Performance'] as const
type Tab = typeof TABS[number]

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useAdminService(id)
  const update = useUpdateAdminService()
  const performance = useServicePerformance(id)
  const plans = useServicePlans(id)
  const createPlan = useCreateServicePlan()
  const updatePlan = useUpdateServicePlan()
  const deletePlan = useDeleteServicePlan()
  const { formatCurrency } = useCurrency()
  const perm = usePermission()
  const canWrite = perm.isCEO || perm.isOps

  const [tab, setTab] = useState<Tab>('Basics')
  const [form, setForm] = useState<Partial<AdminServiceRow>>({})

  // Plan editor state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planEditTarget, setPlanEditTarget] = useState<ServicePlan | null>(null)
  const [planDeleteTarget, setPlanDeleteTarget] = useState<ServicePlan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    priceUsd: '',
    priceBdt: '',
    deliveryDays: '',
    features: '', // newline-separated
    isPopular: false,
    displayOrder: '',
  })

  const openPlanCreate = () => {
    setPlanEditTarget(null)
    setPlanForm({ name: '', priceUsd: '', priceBdt: '', deliveryDays: '', features: '', isPopular: false, displayOrder: '' })
    setPlanModalOpen(true)
  }
  const openPlanEdit = (p: ServicePlan) => {
    setPlanEditTarget(p)
    setPlanForm({
      name: p.name,
      priceUsd: String(p.priceUsd),
      priceBdt: p.priceBdt != null ? String(p.priceBdt) : '',
      deliveryDays: p.deliveryDays != null ? String(p.deliveryDays) : '',
      features: (p.features ?? []).join('\n'),
      isPopular: !!p.isPopular,
      displayOrder: String(p.displayOrder ?? 0),
    })
    setPlanModalOpen(true)
  }

  const handlePlanSave = async () => {
    if (!id) return
    if (!planForm.name.trim()) return toast.error('Plan name is required')
    const priceUsd = Number(planForm.priceUsd)
    if (!Number.isFinite(priceUsd) || priceUsd < 0) return toast.error('USD price must be a non-negative number')

    const payload = {
      name: planForm.name.trim(),
      priceUsd,
      priceBdt: planForm.priceBdt ? Number(planForm.priceBdt) : undefined,
      deliveryDays: planForm.deliveryDays ? Number(planForm.deliveryDays) : undefined,
      features: planForm.features.split('\n').map((s) => s.trim()).filter(Boolean),
      isPopular: planForm.isPopular,
      displayOrder: planForm.displayOrder ? Number(planForm.displayOrder) : 0,
    }
    try {
      if (planEditTarget) {
        await updatePlan.mutateAsync({ serviceId: id, planId: planEditTarget.id, patch: payload })
        toast.success('Plan updated')
      } else {
        await createPlan.mutateAsync({ serviceId: id, plan: payload })
        toast.success('Plan created')
      }
      setPlanModalOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Plan save failed')
    }
  }

  const handlePlanDelete = async () => {
    if (!id || !planDeleteTarget) return
    try {
      await deletePlan.mutateAsync({ serviceId: id, planId: planDeleteTarget.id })
      toast.success('Plan removed')
      setPlanDeleteTarget(null)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Delete failed')
    }
  }

  // Hydrate form when data lands or changes
  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  useHeaderConfig(useMemo(() => ({
    title: data?.name ?? 'Service',
    breadcrumbs: [
      { label: 'Admin' },
      { label: 'Services', href: '/admin/services' },
      { label: data?.name ?? '…' },
    ],
  }), [data?.name]))

  const dirty = useMemo(() => {
    if (!data) return false
    const keys: (keyof AdminServiceRow)[] = [
      'name', 'slug', 'category', 'status', 'basePriceUsd', 'priceBdt',
      'turnaroundDays', 'shortDescription', 'fullDescription', 'icon',
      'featured', 'displayOrder', 'metaTitle', 'metaDescription',
    ]
    return keys.some((k) => (form as any)[k] !== (data as any)[k])
  }, [data, form])

  const handleSave = async () => {
    if (!id) return
    try {
      const patch: any = {}
      Object.keys(form).forEach((k) => {
        if ((form as any)[k] !== (data as any)?.[k]) patch[k] = (form as any)[k]
      })
      if (Object.keys(patch).length === 0) {
        toast.info('No changes')
        return
      }
      await update.mutateAsync({ id, patch })
      toast.success('Service saved')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Save failed')
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Service not found.</div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Link to="/admin/services" className="mb-3 inline-flex items-center text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to services
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {form.featured && <Star className="h-4 w-4 text-amber-500" />}
                <h2 className="text-xl font-semibold">{data.name}</h2>
                <Badge variant={(data.status as string) === 'Active' ? 'success' : 'default'} size="sm">
                  {String(data.status ?? 'Active')}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="font-mono">/{data.slug}</span>
                {data.category && <span>· {data.category}</span>}
                {data.basePriceUsd != null && <span>· {formatCurrency(data.basePriceUsd)}</span>}
                {data.turnaroundDays != null && <span>· {data.turnaroundDays}d turnaround</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data.slug && (
                <a
                  className="inline-flex items-center text-xs text-primary-600 hover:underline"
                  href={`https://pouchcare.com.bd/services/${data.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on landing <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
              {canWrite && (
                <Button size="sm" onClick={handleSave} disabled={update.isPending || !dirty}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {update.isPending ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                </Button>
              )}
            </div>
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
            {tab === 'Basics' && (
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!canWrite}
                />
                <Input
                  label="Slug"
                  value={form.slug ?? ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  disabled={!canWrite}
                />
                <Input
                  label="Category"
                  value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={!canWrite}
                />
                <Input
                  label="Icon (emoji or URL)"
                  value={form.icon ?? ''}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  disabled={!canWrite}
                />
                <Textarea
                  label="Short description"
                  value={form.shortDescription ?? ''}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  rows={2}
                  disabled={!canWrite}
                />
                <Textarea
                  label="Full description (markdown OK)"
                  value={form.fullDescription ?? ''}
                  onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
                  rows={6}
                  disabled={!canWrite}
                />
              </div>
            )}

            {tab === 'Pricing' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Base price (USD)"
                    type="number"
                    value={form.basePriceUsd != null ? String(form.basePriceUsd) : ''}
                    onChange={(e) => setForm({ ...form, basePriceUsd: e.target.value === '' ? undefined : Number(e.target.value) })}
                    disabled={!canWrite}
                  />
                  <Input
                    label="Base price (BDT)"
                    type="number"
                    value={form.priceBdt != null ? String(form.priceBdt) : ''}
                    onChange={(e) => setForm({ ...form, priceBdt: e.target.value === '' ? undefined : Number(e.target.value) })}
                    disabled={!canWrite}
                  />
                </div>
                <Input
                  label="Turnaround days"
                  type="number"
                  value={form.turnaroundDays != null ? String(form.turnaroundDays) : ''}
                  onChange={(e) => setForm({ ...form, turnaroundDays: e.target.value === '' ? undefined : Number(e.target.value) })}
                  disabled={!canWrite}
                />
                <p className="text-xs text-gray-500">
                  Tiered plans (ServicePlan model) ship in Phase 3.
                </p>
              </div>
            )}

            {tab === 'Plans' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Tiered pricing for this service. Customers pick a plan when ordering.
                  </p>
                  {canWrite && (
                    <Button size="sm" onClick={openPlanCreate}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> New plan
                    </Button>
                  )}
                </div>
                {plans.isLoading && <div className="text-sm text-gray-400">Loading plans…</div>}
                {plans.error && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    {String((plans.error as any)?.response?.data?.error ?? plans.error.message ?? 'Plans not available')}
                    <div className="mt-1 text-[11px]">Run <code>npx prisma migrate deploy</code> if you've just pulled the ServicePlan migration.</div>
                  </div>
                )}
                {(plans.data ?? []).length === 0 && !plans.isLoading && !plans.error && (
                  <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-800">
                    No plans yet. Add one to enable tiered pricing.
                  </div>
                )}
                <div className="space-y-2">
                  {(plans.data ?? []).map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          {p.isPopular && <Badge variant="warning" size="sm">Popular</Badge>}
                          <span className="font-mono text-xs text-gray-400">#{p.displayOrder}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {formatCurrency(p.priceUsd)}
                          {p.priceBdt != null && ` · ৳${p.priceBdt}`}
                          {p.deliveryDays != null && ` · ${p.deliveryDays}d`}
                        </div>
                        {p.features?.length > 0 && (
                          <ul className="mt-1 list-inside list-disc text-xs text-gray-600 dark:text-gray-400">
                            {p.features.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        )}
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openPlanEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={() => setPlanDeleteTarget(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'SEO' && (
              <div className="space-y-3">
                <Input
                  label="Meta title"
                  value={form.metaTitle ?? ''}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  disabled={!canWrite}
                />
                <Textarea
                  label="Meta description"
                  value={form.metaDescription ?? ''}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  rows={3}
                  disabled={!canWrite}
                />
                <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800">
                  Public URL: <code>https://pouchcare.com.bd/services/{form.slug ?? '…'}</code>
                </div>
              </div>
            )}

            {tab === 'Visibility' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <select
                    value={String(form.status ?? 'Active')}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={!canWrite}
                    className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <Input
                  label="Display order"
                  type="number"
                  value={form.displayOrder != null ? String(form.displayOrder) : ''}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value === '' ? undefined : Number(e.target.value) })}
                  disabled={!canWrite}
                />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    disabled={!canWrite}
                  />
                  <span>Featured (appears first on landing)</span>
                </label>
              </div>
            )}

            {tab === 'Performance' && (
              <div className="space-y-4">
                {performance.isLoading && <div className="text-sm text-gray-400">Loading aggregates…</div>}
                {performance.data && (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Stat label="Orders 30d" value={String(performance.data.orders30d)} />
                      <Stat label="Orders 90d" value={String(performance.data.orders90d)} />
                      <Stat label="Revenue 30d" value={formatCurrency(performance.data.revenue30dUsd)} />
                      <Stat label="Revenue 90d" value={formatCurrency(performance.data.revenue90dUsd)} />
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">By status</h4>
                      <div className="space-y-1.5">
                        {Object.entries(performance.data.byStatus).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{k}</span>
                            <span className="font-mono font-semibold">{v}</span>
                          </div>
                        ))}
                        {Object.keys(performance.data.byStatus).length === 0 && (
                          <div className="text-sm text-gray-400">No orders yet for this service.</div>
                        )}
                      </div>
                    </div>
                    {performance.data.avgRating != null && (
                      <div className="text-sm">
                        Average rating:{' '}
                        <span className="font-semibold">
                          {Number(performance.data.avgRating).toFixed(2)} / 5
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Generated {new Date(performance.data.generatedAt).toLocaleTimeString()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan create/edit modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={planEditTarget ? `Edit plan "${planEditTarget.name}"` : 'New plan'}
      >
        <div className="space-y-3">
          <Input
            label="Plan name"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            placeholder="Starter / Pro / Enterprise"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (USD)"
              type="number"
              value={planForm.priceUsd}
              onChange={(e) => setPlanForm({ ...planForm, priceUsd: e.target.value })}
            />
            <Input
              label="Price (BDT)"
              type="number"
              value={planForm.priceBdt}
              onChange={(e) => setPlanForm({ ...planForm, priceBdt: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Delivery days"
              type="number"
              value={planForm.deliveryDays}
              onChange={(e) => setPlanForm({ ...planForm, deliveryDays: e.target.value })}
            />
            <Input
              label="Display order"
              type="number"
              value={planForm.displayOrder}
              onChange={(e) => setPlanForm({ ...planForm, displayOrder: e.target.value })}
            />
          </div>
          <Textarea
            label="Features (one per line)"
            value={planForm.features}
            onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
            rows={4}
            placeholder={'Unlimited revisions\nPriority support\n…'}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={planForm.isPopular}
              onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
            />
            <span>Mark as popular (highlight on landing)</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPlanModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePlanSave} disabled={createPlan.isPending || updatePlan.isPending}>
              {(createPlan.isPending || updatePlan.isPending) ? 'Saving…' : planEditTarget ? 'Save plan' : 'Create plan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!planDeleteTarget}
        onClose={() => setPlanDeleteTarget(null)}
        onConfirm={handlePlanDelete}
        title={`Remove plan "${planDeleteTarget?.name ?? ''}"?`}
        message="The plan is removed immediately. Existing orders that referenced it are unaffected."
        confirmLabel="Remove"
        variant="danger"
      />
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

// Append plan modals to the rendered tree via a portal-style fragment.
// (They live inside the default export above through the closures.)
