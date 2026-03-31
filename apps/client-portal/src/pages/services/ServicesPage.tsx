import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const CATS = ['All', 'SEO', 'Dev', 'Design', 'Content', 'Marketing']

export default function ServicesPage() {
  const navigate = useNavigate()
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['services', cat],
    queryFn: () => api.get(`/services${cat !== 'All' ? `?category=${cat}` : ''}`).then(r => r.data).catch(() => ({ data: [] })),
  })

  const filtered = (data?.data || []).filter((s: any) => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  usePageHeader('🛍️ Services', 'Professional digital services')

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..."
          className="bg-midnight-card border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 w-48 placeholder:text-text-muted" />
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${cat === c ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>{c}</button>
        ))}
      </div>
      {isLoading
        ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-44 rounded-xl"/>)}</div>
        : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id} onClick={() => navigate(`/services/${s.slug}`)}
              className="bg-midnight-card border border-midnight-border rounded-xl p-5 hover:border-sky-500/40 hover:-translate-y-0.5 transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{s.icon || '⚡'}</span>
                  <div>
                    <h3 className="font-sora font-semibold text-text-primary group-hover:text-sky-400 transition-colors">{s.name}</h3>
                    <p className="text-xs text-text-muted">{s.category}</p>
                  </div>
                </div>
                {s.featured && <Badge label="Popular" color="yellow" dot={false} />}
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">{s.shortDescription || 'Professional service delivery.'}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xl text-sky-400">{formatCurrency(s.basePriceUsd)}<span className="text-xs text-text-muted font-inter font-normal ml-1">/ order</span></span>
                <div className="flex items-center gap-2">
                  {s.turnaroundDays && <span className="text-xs text-text-muted">⏱ {s.turnaroundDays}d</span>}
                  <Button size="sm">Order Now</Button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-span-2 text-center py-16 text-text-muted"><span className="text-4xl block mb-3">🔍</span><p>No services found.</p></div>}
        </div>
      }
    </div>
  )
}
