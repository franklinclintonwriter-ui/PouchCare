import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

const TABS = ['Invoices', 'Expenses', 'Payroll', 'Revenue']

function InvoiceList() {
  const [status, setStatus] = useState('All')
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.get(`/finance/invoices${status !== 'All' ? `?status=${status}` : ''}`).then(r => r.data).catch(() => ({ data: [] })),
  })
  const statusFilters = ['All', 'Draft', 'Sent', 'Paid', 'Overdue']
  const statusClr: Record<string, any> = { Paid: 'green', Sent: 'sky', Draft: 'gray', Overdue: 'red', Cancelled: 'gray' }
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {statusFilters.map(s => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${status === s ? 'bg-sky-500 text-white border-sky-500' : 'text-text-muted border-midnight-border hover:border-white/20'}`}>{s}</button>)}
      </div>
      <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0B1528]">
            {['Invoice #', 'Client', 'Service', 'Amount', 'Due Date', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 rounded" /></td></tr>)
              : (data?.data || []).map((inv: any) => (
                <tr key={inv.id} className="border-t border-midnight-border hover:bg-midnight-hover">
                  <td className="px-4 py-3 font-mono text-xs text-sky-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{inv.clientName || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{inv.service || '—'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-green-400">{formatCurrency(inv.amountUsd)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="px-4 py-3"><Badge label={inv.status} color={statusClr[inv.status] || 'gray'} /></td>
                  <td className="px-4 py-3">
                    {inv.status !== 'Paid' && (
                      <button onClick={() => api.put(`/finance/invoices/${inv.id}/mark-paid`)}
                        className="text-xs text-green-400 hover:underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))
            }
            {!isLoading && (data?.data || []).length === 0 && <tr><td colSpan={7} className="py-10 text-center text-text-muted">No invoices found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpenseList() {
  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/finance/expenses').then(r => r.data).catch(() => ({ data: [] })),
  })
  return (
    <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-[#0B1528]">
          {['Title', 'Category', 'Amount', 'Branch', 'Date', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}
        </tr></thead>
        <tbody>
          {(data?.data || []).map((exp: any) => (
            <tr key={exp.id} className="border-t border-midnight-border hover:bg-midnight-hover">
              <td className="px-4 py-3 font-medium text-text-primary">{exp.title}</td>
              <td className="px-4 py-3 text-text-secondary text-xs">{exp.category || '—'}</td>
              <td className="px-4 py-3 font-mono text-red-400 font-bold">{formatCurrency(exp.amountUsd)}</td>
              <td className="px-4 py-3 text-text-muted text-xs">{exp.branch || '—'}</td>
              <td className="px-4 py-3 text-text-muted text-xs">{formatDate(exp.expenseDate)}</td>
              <td className="px-4 py-3"><Badge label={exp.status} color={statusColor(exp.status.toLowerCase()) as any} /></td>
            </tr>
          ))}
          {(data?.data || []).length === 0 && <tr><td colSpan={6} className="py-10 text-center text-text-muted">No expenses found.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function PayrollList() {
  const { data } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => api.get('/payroll').then(r => r.data).catch(() => ({ data: [] })),
  })
  return (
    <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-[#0B1528]">
          {['Staff', 'Month/Year', 'Base', 'Bonus', 'Deductions', 'Net', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}
        </tr></thead>
        <tbody>
          {(data?.data || []).map((p: any) => (
            <tr key={p.id} className="border-t border-midnight-border hover:bg-midnight-hover">
              <td className="px-4 py-3 font-medium text-text-primary">{p.staffName}</td>
              <td className="px-4 py-3 text-text-muted text-xs font-mono">{p.month} {p.year}</td>
              <td className="px-4 py-3 font-mono text-xs text-text-secondary">{formatCurrency(p.baseSalary)}</td>
              <td className="px-4 py-3 font-mono text-xs text-green-400">+{formatCurrency(p.bonus)}</td>
              <td className="px-4 py-3 font-mono text-xs text-red-400">-{formatCurrency(p.deductions)}</td>
              <td className="px-4 py-3 font-mono font-bold text-sky-400">{formatCurrency(p.netSalary)}</td>
              <td className="px-4 py-3"><Badge label={p.paymentStatus} color={p.paymentStatus === 'Paid' ? 'green' : 'yellow'} /></td>
            </tr>
          ))}
          {(data?.data || []).length === 0 && <tr><td colSpan={7} className="py-10 text-center text-text-muted">No payroll records.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function RevenueOverview() {
  const year = new Date().getFullYear()
  const { data } = useQuery({
    queryKey: ['revenue', year],
    queryFn: () => api.get(`/finance/revenue/monthly?year=${year}`).then(r => r.data.data).catch(() => []),
  })
  const total = (data || []).reduce((s: number, r: any) => s + r.totalRevenueUsd, 0)
  const expenses = (data || []).reduce((s: number, r: any) => s + r.totalExpenses, 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Revenue" value={formatCurrency(total)} icon="💰" color="sky" mono={false} />
        <KpiCard label="Total Expenses" value={formatCurrency(expenses)} icon="💸" color="red" mono={false} />
        <KpiCard label="Net Profit" value={formatCurrency(total - expenses)} icon="📈" color="green" mono={false} />
      </div>
      <div className="bg-midnight-card border border-midnight-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0B1528]">
            {['Month', 'Revenue', 'Expenses', 'Net Profit', 'Clients'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>)}
          </tr></thead>
          <tbody>
            {(data || []).map((r: any) => (
              <tr key={`${r.month}${r.year}`} className="border-t border-midnight-border">
                <td className="px-4 py-3 font-medium text-text-primary">{r.month} {r.year}</td>
                <td className="px-4 py-3 font-mono text-green-400 font-bold">{formatCurrency(r.totalRevenueUsd)}</td>
                <td className="px-4 py-3 font-mono text-red-400">{formatCurrency(r.totalExpenses)}</td>
                <td className="px-4 py-3 font-mono text-sky-400 font-bold">{formatCurrency(r.netProfit)}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{r.clientCount}</td>
              </tr>
            ))}
            {(data || []).length === 0 && <tr><td colSpan={5} className="py-10 text-center text-text-muted">No revenue records for {year}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [tab, setTab] = useState('Invoices')
  const { openSlideOver, closeSlideOver } = useUiStore()

  usePageHeader('💰 Finance', 'Invoices, Expenses, Payroll & Revenue')

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-midnight-border">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-sky-500 text-sky-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Invoices' && <InvoiceList />}
      {tab === 'Expenses' && <ExpenseList />}
      {tab === 'Payroll' && <PayrollList />}
      {tab === 'Revenue' && <RevenueOverview />}
    </div>
  )
}
