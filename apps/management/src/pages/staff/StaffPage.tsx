import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const col = createColumnHelper<any>()
const COLS = [
  col.accessor('memberId', { header: 'ID', cell: i => <span className="font-mono text-xs text-text-muted">EMP-{i.getValue()}</span> }),
  col.accessor('name', { header: 'Name', cell: i => (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px] font-bold text-sky-400 flex-shrink-0">{getInitials(i.getValue())}</div>
      <span className="font-medium text-text-primary">{i.getValue()}</span>
    </div>
  )}),
  col.accessor('systemRole', { header: 'Role', cell: i => <span className="text-xs text-text-muted">{i.getValue().replace(/_/g, ' ')}</span> }),
  col.accessor('branch', { header: 'Branch', cell: i => <span className="text-xs">{i.getValue() || '—'}</span> }),
  col.accessor('primarySkill', { header: 'Skill', cell: i => <span className="text-xs text-text-secondary">{i.getValue() || '—'}</span> }),
  col.accessor('averageTaskRating', { header: 'Rating', cell: i => (
    <span className={`font-mono text-sm font-bold ${i.getValue() >= 8 ? 'text-green-400' : i.getValue() >= 6 ? 'text-yellow-400' : 'text-text-muted'}`}>
      {i.getValue() ? `${i.getValue()}/10` : '—'}
    </span>
  )}),
  col.accessor('status', { header: 'Status', cell: i => <Badge label={i.getValue()} color={i.getValue() === 'Active' ? 'green' : i.getValue() === 'Inactive' ? 'red' : 'yellow'} /> }),
]

function StaffSlideOver({ staff, onClose }: { staff?: any; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [rating, setRating] = useState(staff?.ceoPerformanceRating || '')
  const [note, setNote] = useState(staff?.ceoRatingNote || '')

  const rateMutation = useMutation({
    mutationFn: () => api.post(`/staff/members/${staff.id}/rate`, { rating: Number(rating), note }),
    onSuccess: () => { toast.success('Rating saved'); qc.invalidateQueries({ queryKey: ['staff'] }); onClose() },
    onError: () => toast.error('Failed to save rating'),
  })

  if (!staff) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">{getInitials(staff.name)}</div>
          <div>
            <h2 className="font-sora font-semibold text-lg">{staff.name}</h2>
            <p className="text-xs text-text-muted">EMP-{staff.memberId} · {staff.systemRole.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted text-2xl hover:text-text-primary">×</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
        {[
          ['Branch', staff.branch || '—'], ['Email', staff.email],
          ['Phone', staff.phone || '—'], ['Skill', staff.primarySkill || '—'],
          ['Level', staff.skillLevel || '—'], ['Experience', staff.yearsExperience ? `${staff.yearsExperience} yrs` : '—'],
          ['Tasks Done', staff.tasksCompleted], ['Salary', staff.salary ? formatCurrency(staff.salary) : '—'],
          ['Joined', staff.joinDate ? formatDate(staff.joinDate) : '—'], ['Employment', staff.employmentType || '—'],
        ].map(([l, v]) => (
          <div key={String(l)}>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">{l}</p>
            <p className="text-text-primary font-medium text-xs">{String(v)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-midnight-border pt-4">
        <h3 className="font-sora font-semibold text-sm mb-3">⭐ CEO Rating</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-1.5">Rating (1-10)</label>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${Number(rating) === n ? 'bg-sky-500 text-white border-sky-500' : 'border-midnight-border text-text-muted hover:border-sky-500/40'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Rating note..."
            className="w-full bg-[#0d1528] border border-midnight-border text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none placeholder:text-text-muted" />
          <Button className="w-full" onClick={() => rateMutation.mutate()} loading={rateMutation.isPending} disabled={!rating}>
            Save Rating
          </Button>
        </div>
      </div>
    </div>
  )
}

function CreateStaffForm({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data: any) => {
    try {
      await api.post('/staff/members', data)
      toast.success('Staff member created')
      qc.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed to create') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sora font-semibold text-lg">➕ Add Staff Member</h2>
        <button onClick={onClose} className="text-text-muted text-2xl">×</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name *" placeholder="John Doe" error={errors.name?.message as string} {...register('name', { required: 'Required' })} />
          <Input label="Email *" type="email" placeholder="john@pouchcare.com" error={errors.email?.message as string} {...register('email', { required: 'Required' })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Password *" type="password" placeholder="Min 8 chars" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
          <Select label="System Role *" options={[
            { value: '', label: 'Select role' },
            { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
            { value: 'STAFF', label: 'Staff' },
            { value: 'INTERN', label: 'Intern' },
            { value: 'HR_MANAGER', label: 'HR Manager' },
          ]} {...register('systemRole', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Branch" placeholder="Bangladesh HQ" {...register('branch')} />
          <Input label="Job Role" placeholder="SEO Specialist" {...register('jobRole')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" placeholder="+880..." {...register('phone')} />
          <Input label="Salary (USD)" type="number" placeholder="800" {...register('salary', { valueAsNumber: true })} />
        </div>
        <Select label="Employment Type" options={[
          { value: 'FULL_TIME', label: 'Full-Time' }, { value: 'PART_TIME', label: 'Part-Time' },
          { value: 'REMOTE', label: 'Remote' }, { value: 'INTERN', label: 'Intern' },
        ]} {...register('employmentType')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Create Staff Member</Button>
      </form>
    </div>
  )
}

const ROLES = ['All', 'BRANCH_MANAGER', 'STAFF', 'INTERN', 'HR_MANAGER']

export default function StaffPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [branch, setBranch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['staff', search, role, branch],
    queryFn: () => {
      const p = new URLSearchParams()
      if (search) p.set('q', search)
      if (role !== 'All') p.set('role', role)
      if (branch) p.set('branch', branch)
      return api.get(`/staff/members?${p}`).then(r => r.data).catch(() => ({ data: [], meta: { total: 0 } }))
    },
  })

  usePageHeader('👥 Staff', `${data?.meta?.total || 0} members`,
    <Button size="sm" onClick={() => openSlideOver(<CreateStaffForm onClose={closeSlideOver} />)}>+ Add Staff</Button>
  )

  return (
    <div>
      <div className="sticky top-16 bg-midnight z-10 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
            className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-52 placeholder:text-text-muted" />
          <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="Filter by branch..."
            className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-44 placeholder:text-text-muted" />
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${role === r ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>
              {r === 'All' ? 'All' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        data={data?.data || []}
        columns={COLS}
        loading={isLoading}
        onRowClick={staff => openSlideOver(<StaffSlideOver staff={staff} onClose={closeSlideOver} />)}
        emptyState="No staff found."
      />
    </div>
  )
}
