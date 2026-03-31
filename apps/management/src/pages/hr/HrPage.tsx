import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Job Positions', 'Applications']
const STATUS_COLOR: Record<string, any> = { Open: 'green', Closed: 'gray', 'On Hold': 'yellow', Filled: 'sky', New: 'gray', Screening: 'sky', Interview: 'yellow', Offer: 'yellow', Hired: 'green', Rejected: 'red' }

export default function HrPage() {
  const [tab, setTab] = useState('Job Positions')
  const { openSlideOver, closeSlideOver } = useUiStore()
  const toast = useToast(); const qc = useQueryClient()

  const { data: positions } = useQuery({ queryKey: ['positions'], queryFn: () => api.get('/hr/positions').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: applications } = useQuery({ queryKey: ['applications'], queryFn: () => api.get('/hr/applications').then(r => r.data).catch(() => ({ data: [] })) })

  const updateApp = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/hr/applications/${id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['applications'] }) },
  })

  usePageHeader('👔 HR & Recruitment', undefined,
    <Button size="sm" onClick={() => openSlideOver(
      <div className="p-4"><h3 className="font-sora font-semibold mb-2">Create Job Position</h3><p className="text-text-muted text-sm">Connect to POST /hr/positions</p></div>
    )}>+ Post Job</Button>
  )

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-midnight-border">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t}</button>)}
      </div>

      {tab === 'Job Positions' && (
        <div className="grid gap-3">
          {(positions?.data || []).map((p: any) => (
            <div key={p.id} className="bg-midnight-card border border-midnight-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{p.department || '—'} · {p.branch || '—'} · {p.employmentType || '—'}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  {p.salaryMin && <span>💰 {formatCurrency(p.salaryMin)} – {formatCurrency(p.salaryMax || p.salaryMin)}</span>}
                  <span>👥 {p.openings} opening(s)</span>
                  <span>📄 {p.applications} applications</span>
                  {p.deadline && <span>⏰ Closes {formatDate(p.deadline)}</span>}
                </div>
              </div>
              <Badge label={p.status} color={STATUS_COLOR[p.status] || 'gray'} />
            </div>
          ))}
          {!(positions?.data || []).length && <div className="text-center py-16 text-text-muted"><span className="text-4xl block mb-3">👔</span><p>No open positions.</p></div>}
        </div>
      )}

      {tab === 'Applications' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Applicant', 'Position', 'Source', 'Applied', 'Experience', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(applications?.data || []).map((a: any) => (
                <tr key={a.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{a.applicantName}</p>
                    <p className="text-xs text-text-muted">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{a.position?.title || '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{a.source || '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{a.appliedDate ? formatDate(a.appliedDate) : '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{a.experienceYears ? `${a.experienceYears} yrs` : '—'}</td>
                  <td className="px-4 py-3"><Badge label={a.status} color={STATUS_COLOR[a.status] || 'gray'} /></td>
                  <td className="px-4 py-3">
                    <select value={a.status}
                      onChange={e => updateApp.mutate({ id: a.id, status: e.target.value })}
                      className="bg-midnight border border-midnight-border text-text-primary text-xs rounded px-2 py-1 outline-none cursor-pointer">
                      {['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!(applications?.data || []).length && <tr><td colSpan={7} className="py-10 text-center text-text-muted">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
