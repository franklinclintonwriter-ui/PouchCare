import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Domains', 'Servers', 'Websites']

export default function AssetsPage() {
  const [tab, setTab] = useState('Domains')

  const { data: domains } = useQuery({ queryKey: ['domains'], queryFn: () => api.get('/assets/domains').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: () => api.get('/assets/servers').then(r => r.data).catch(() => ({ data: [] })) })
  const { data: websites } = useQuery({ queryKey: ['websites'], queryFn: () => api.get('/assets/websites').then(r => r.data).catch(() => ({ data: [] })) })

  const soonExpiring = (domains?.data || []).filter((d: any) => {
    if (!d.expiryDate) return false
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000)
    return days <= 30 && days > 0
  })

  usePageHeader('🏢 Digital Assets', 'Domains, Servers & Websites')

  return (
    <div>

      {soonExpiring.length > 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400 font-semibold text-sm">⚠️ {soonExpiring.length} domain(s) expiring in 30 days:</p>
          <p className="text-xs text-yellow-300 mt-1">{soonExpiring.map((d: any) => d.name).join(', ')}</p>
        </div>
      )}

      <div className="flex gap-1 mb-5 border-b border-midnight-border">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t}</button>)}
      </div>

      {tab === 'Domains' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Domain', 'Registrar', 'DA/DR', 'Expiry', 'SSL', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(domains?.data || []).map((d: any) => {
                const daysLeft = d.expiryDate ? Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) : null
                return (
                  <tr key={d.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                    <td className="px-4 py-3 font-medium text-text-primary font-mono text-xs">{d.name}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{d.registrar || '—'}</td>
                    <td className="px-4 py-3 text-xs"><span className="text-sky-400 font-mono">{d.daScore || '—'}</span><span className="text-text-muted">/</span><span className="text-green-400 font-mono">{d.drScore || '—'}</span></td>
                    <td className="px-4 py-3 text-xs">
                      {d.expiryDate ? (
                        <span className={daysLeft && daysLeft <= 30 ? 'text-yellow-400 font-semibold' : 'text-text-muted'}>{formatDate(d.expiryDate)}{daysLeft && daysLeft <= 60 ? ` (${daysLeft}d)` : ''}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge label={d.sslStatus || 'None'} color={d.sslStatus === 'Active' ? 'green' : 'red'} /></td>
                    <td className="px-4 py-3"><Badge label={d.status} color={d.status === 'Active' ? 'green' : d.status === 'Expired' ? 'red' : 'yellow'} /></td>
                  </tr>
                )
              })}
              {!(domains?.data || []).length && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No domains yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Servers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(servers?.data || []).map((s: any) => (
            <div key={s.id} className="bg-midnight-card border border-midnight-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div><p className="font-semibold text-text-primary">{s.name}</p><p className="text-xs text-text-muted">{s.provider} · {s.location}</p></div>
                <Badge label={s.status} color={s.status === 'Active' ? 'green' : 'yellow'} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-midnight rounded-lg p-2"><p className="font-mono font-bold text-sky-400">{s.ramGb}GB</p><p className="text-text-muted">RAM</p></div>
                <div className="bg-midnight rounded-lg p-2"><p className="font-mono font-bold text-green-400">{s.storageGb}GB</p><p className="text-text-muted">Storage</p></div>
                <div className="bg-midnight rounded-lg p-2"><p className="font-mono font-bold text-yellow-400">{s.monthlyCostUsd ? `$${s.monthlyCostUsd}` : '—'}</p><p className="text-text-muted">Monthly</p></div>
              </div>
              <p className="text-xs text-text-muted mt-2 font-mono">{s.ipAddress || '—'}</p>
            </div>
          ))}
          {!(servers?.data || []).length && <div className="text-center py-16 text-text-muted col-span-2"><span className="text-4xl block mb-3">🖥️</span><p>No servers yet.</p></div>}
        </div>
      )}

      {tab === 'Websites' && (
        <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0B1528]">{['Website', 'Platform', 'DA', 'Traffic', 'SSL', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {(websites?.data || []).map((w: any) => (
                <tr key={w.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3"><p className="font-medium text-text-primary">{w.name}</p><p className="text-xs text-sky-400">{w.url || '—'}</p></td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{w.platform || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sky-400 text-xs">{w.daScore || '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{w.monthlyTraffic?.toLocaleString() || '—'}</td>
                  <td className="px-4 py-3"><Badge label={w.sslStatus || 'None'} color={w.sslStatus === 'Active' ? 'green' : 'red'} /></td>
                  <td className="px-4 py-3"><Badge label={w.status} color={w.status === 'Live' ? 'green' : 'yellow'} /></td>
                </tr>
              ))}
              {!(websites?.data || []).length && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No websites yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
