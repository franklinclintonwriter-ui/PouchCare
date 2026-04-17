import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Star, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import {
  useAdminServices,
  useCreateAdminService,
  useUpdateAdminService,
  useDeleteAdminService,
  type AdminServiceRow,
} from '@/api/admin-services'
import { PageTransition } from '@/components/ui/PageTransition'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCurrency } from '@/hooks/useCurrency'
import { usePermission } from '@/hooks/usePermission'

interface FormState {
  name: string
  slug: string
  category: string
  status: string
  basePriceUsd: string
  turnaroundDays: string
  shortDescription: string
  fullDescription: string
  featured: boolean
  displayOrder: string
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  category: '',
  status: 'Active',
  basePriceUsd: '',
  turnaroundDays: '',
  shortDescription: '',
  fullDescription: '',
  featured: false,
  displayOrder: '',
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export default function ServiceCatalog() {
  const navigate = useNavigate()
  const { data, isLoading } = useAdminServices()
  const create = useCreateAdminService()
  const update = useUpdateAdminService()
  const del = useDeleteAdminService()
  const { formatCurrency } = useCurrency()
  const perm = usePermission()
  const canWrite = perm.isCEO || perm.isOps

  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminServiceRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminServiceRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setOpen(true)
  }
  const openEdit = (row: AdminServiceRow) => {
    setEditTarget(row)
    setForm({
      name: row.name,
      slug: row.slug ?? '',
      category: row.category ?? '',
      status: (row.status as string) ?? 'Active',
      basePriceUsd: row.basePriceUsd != null ? String(row.basePriceUsd) : '',
      turnaroundDays: row.turnaroundDays != null ? String(row.turnaroundDays) : '',
      shortDescription: row.shortDescription ?? '',
      fullDescription: row.fullDescription ?? '',
      featured: !!row.featured,
      displayOrder: row.displayOrder != null ? String(row.displayOrder) : '',
    })
    setOpen(true)
  }

  useHeaderConfig(useMemo(() => ({
    title: 'Services',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Services' }],
    actions: canWrite
      ? [{ type: 'button' as const, label: 'New service', icon: Plus, onClick: openCreate }]
      : [],
  }), [canWrite]))

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    const slug = (form.slug || slugify(form.name)).trim()
    if (!/^[a-z0-9-]+$/.test(slug)) return toast.error('Slug must be lowercase letters, digits, and dashes')

    const payload: any = {
      name: form.name.trim(),
      slug,
      category: form.category || undefined,
      status: form.status || undefined,
      basePriceUsd: form.basePriceUsd ? Number(form.basePriceUsd) : undefined,
      turnaroundDays: form.turnaroundDays ? Number(form.turnaroundDays) : undefined,
      shortDescription: form.shortDescription || undefined,
      fullDescription: form.fullDescription || undefined,
      featured: form.featured,
      displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
    }

    try {
      if (editTarget) {
        await update.mutateAsync({ id: editTarget.id, patch: payload })
        toast.success('Service updated')
      } else {
        await create.mutateAsync(payload)
        toast.success('Service created')
      }
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Save failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await del.mutateAsync(deleteTarget.id)
      toast.success('Service archived')
      setDeleteTarget(null)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Delete failed')
    }
  }

  const rows = data ?? []

  const columns: Column<AdminServiceRow>[] = [
    {
      key: 'name', label: 'Service', sticky: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {r.featured && <Star className="mr-1 inline h-3.5 w-3.5 text-amber-500" />}
            {r.name}
          </div>
          <div className="text-xs text-gray-500">/{r.slug}</div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => <span>{r.category ?? '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (r) => {
        const s = (r.status as string) ?? 'Active'
        const variant = s === 'Active' ? 'success' : s === 'Draft' ? 'warning' : 'default'
        return <Badge variant={variant} size="sm">{s}</Badge>
      },
    },
    {
      key: 'basePriceUsd', label: 'Base price', align: 'right',
      render: (r) => <span className="font-medium">{r.basePriceUsd != null ? formatCurrency(r.basePriceUsd) : '—'}</span>,
    },
    {
      key: 'turnaroundDays', label: 'Turnaround', align: 'right',
      render: (r) => <span className="text-sm">{r.turnaroundDays != null ? `${r.turnaroundDays}d` : '—'}</span>,
    },
    {
      key: 'displayOrder', label: 'Order', align: 'right',
      render: (r) => <span className="font-mono text-xs text-gray-500">{r.displayOrder ?? '—'}</span>,
    },
    ...(canWrite
      ? [{
          key: 'actions' as keyof AdminServiceRow,
          label: '',
          align: 'right' as const,
          render: (r: AdminServiceRow) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(r)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(r)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        }]
      : []),
  ]

  return (
    <PageTransition>
      <div className="space-y-4">
        <DataTable<AdminServiceRow>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyIcon={<Package className="h-10 w-10 text-gray-300" />}
          emptyTitle="No services yet"
          emptyDescription={canWrite ? 'Click "New service" to add one.' : 'Ask an admin to add services.'}
          onRowClick={(r) => navigate(`/admin/services/${r.id}`)}
        />
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editTarget ? 'Edit service' : 'New service'}>
        <div className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => {
              const v = e.target.value
              setForm((f) => ({ ...f, name: v, slug: f.slug || slugify(v) }))
            }}
            placeholder="e.g. Backlinks 20DA"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="lowercase-with-dashes"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="SEO / Hosting / Mobile"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base price (USD)"
              type="number"
              value={form.basePriceUsd}
              onChange={(e) => setForm({ ...form, basePriceUsd: e.target.value })}
            />
            <Input
              label="Turnaround days"
              type="number"
              value={form.turnaroundDays}
              onChange={(e) => setForm({ ...form, turnaroundDays: e.target.value })}
            />
          </div>
          <Input
            label="Short description"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            placeholder="One line shown in the catalog"
          />
          <Textarea
            label="Full description (markdown OK)"
            value={form.fullDescription}
            onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Display order"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            />
            <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <span>Featured</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) ? 'Saving…' : editTarget ? 'Save changes' : 'Create service'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Archive "${deleteTarget?.name ?? ''}"?`}
        message="The service will be hidden from the public catalog. Existing orders are unaffected."
        confirmLabel="Archive"
        variant="danger"
      />
    </PageTransition>
  )
}
