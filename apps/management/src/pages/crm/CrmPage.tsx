import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, timeAgo } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const STAGES = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
const STAGE_COLORS: Record<string, any> = {
  NEW: 'gray', QUALIFIED: 'sky', PROPOSAL: 'yellow', NEGOTIATION: 'yellow', WON: 'green', LOST: 'red'
}

function LeadCard({ lead, onClick }: { lead: any; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-midnight-card border border-midnight-border rounded-xl p-4 cursor-pointer hover:border-sky-500/30 hover:-translate-y-0.5 transition-all mb-2">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{lead.company}</p>
          <p className="text-xs text-text-muted">{lead.contactName || '—'} · {lead.country || '—'}</p>
        </div>
        {lead.leadScore && <span className="font-mono text-xs text-sky-400 flex-shrink-0">{lead.leadScore}pts</span>}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{lead.serviceInterested || '—'}</span>
        {lead.estimatedValue && <span className="font-mono text-green-400 font-bold">{formatCurrency(lead.estimatedValue)}</span>}
      </div>
      {lead.nextFollowUpDate && (
        <p className="text-[10px] text-yellow-400 mt-1.5">📅 Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}</p>
      )}
    </div>
  )
}

function LeadDetail({ lead, onClose }: { lead: any; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [newStage, setNewStage] = useState(lead.stage)

  const updateStage = useMutation({
    mutationFn: (stage: string) => api.put(`/crm/leads/${lead.id}`, { stage }),
    onSuccess: () => { toast.success('Stage updated'); qc.invalidateQueries({ queryKey: ['crm-pipeline'] }); onClose() },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-sora font-semibold text-lg">{lead.company}</h2>
          <p className="text-xs text-text-muted mt-0.5">Lead ID: LID-{lead.leadId}</p>
        </div>
        <button onClick={onClose} className="text-text-muted text-2xl">×</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
        {[
          ['Contact', lead.contactName || '—'], ['Email', lead.email || '—'],
          ['Phone', lead.phone || '—'], ['Country', lead.country || '—'],
          ['Service', lead.serviceInterested || '—'], ['Source', lead.source || '—'],
          ['Budget', lead.budgetUsd ? formatCurrency(lead.budgetUsd) : '—'],
          ['Est. Value', lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'],
          ['Follow-Ups', lead.followUpCount], ['Lead Score', lead.leadScore ? `${lead.leadScore}/100` : '—'],
        ].map(([l, v]) => (
          <div key={String(l)}>
            <p className="text-xs text-text-muted mb-0.5">{l}</p>
            <p className="text-text-primary font-medium text-xs">{String(v)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-midnight-border pt-4">
        <h3 className="text-sm font-semibold mb-3">Move Stage</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {STAGES.map(s => (
            <button key={s} onClick={() => setNewStage(s)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all font-medium ${newStage === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-sky-500/30'}`}>
              {s}
            </button>
          ))}
        </div>
        <Button onClick={() => updateStage.mutate(newStage)} loading={updateStage.isPending} className="w-full">
          Update Stage →
        </Button>
      </div>
    </div>
  )
}

export default function CrmPage() {
  const { openSlideOver, closeSlideOver } = useUiStore()
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['crm-pipeline'],
    queryFn: () => api.get('/crm/pipeline').then(r => r.data.data).catch(() => []),
  })

  const totalValue = (pipeline || []).filter((s: any) => s.stage !== 'LOST').reduce((sum: number, s: any) => sum + s.totalValue, 0)
  const wonCount = (pipeline || []).find((s: any) => s.stage === 'WON')?.count || 0
  const totalLeads = (pipeline || []).reduce((s: number, p: any) => s + p.count, 0)

  usePageHeader('🎯 CRM Pipeline', `${totalLeads} leads · ${formatCurrency(totalValue)} pipeline value`,
    <div className="flex items-center gap-2">
      <div className="flex bg-midnight-card border border-midnight-border rounded-lg p-0.5">
        {(['pipeline', 'list'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === v ? 'bg-sky-500 text-white' : 'text-text-muted'}`}>
            {v === 'pipeline' ? '⧉ Board' : '☰ List'}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => openSlideOver(
        <div className="p-4"><h3 className="font-sora font-semibold mb-2">Add Lead</h3><p className="text-text-muted text-sm">Connect to POST /crm/leads</p></div>
      )}>+ New Lead</Button>
    </div>
  )

  return (
    <div>

      {view === 'pipeline'
        ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const col = (pipeline || []).find((p: any) => p.stage === stage)
              return (
                <div key={stage} className="flex-shrink-0 w-64">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge label={stage} color={STAGE_COLORS[stage]} />
                    <span className="text-xs text-text-muted font-mono">{col?.count || 0}</span>
                    {col?.totalValue > 0 && <span className="text-xs text-green-400 font-mono ml-auto">{formatCurrency(col.totalValue)}</span>}
                  </div>
                  {(col?.leads || []).map((lead: any) => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => openSlideOver(<LeadDetail lead={lead} onClose={closeSlideOver} />)} />
                  ))}
                  {(!col?.leads || col.leads.length === 0) && (
                    <div className="border-2 border-dashed border-midnight-border rounded-xl p-4 text-center text-text-muted text-xs">Empty</div>
                  )}
                </div>
              )
            })}
          </div>
        )
        : (
          <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#0B1528]">
                {['Company', 'Contact', 'Service', 'Stage', 'Value', 'Score'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}
              </tr></thead>
              <tbody>
                {(pipeline || []).flatMap((s: any) => s.leads || []).map((lead: any) => (
                  <tr key={lead.id} onClick={() => openSlideOver(<LeadDetail lead={lead} onClose={closeSlideOver} />)}
                    className="border-t border-midnight-border hover:bg-midnight-hover cursor-pointer">
                    <td className="px-4 py-3 font-medium text-text-primary">{lead.company}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{lead.contactName || '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{lead.serviceInterested || '—'}</td>
                    <td className="px-4 py-3"><Badge label={lead.stage} color={STAGE_COLORS[lead.stage]} /></td>
                    <td className="px-4 py-3 font-mono text-green-400 text-xs">{lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-sky-400 text-xs">{lead.leadScore || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
