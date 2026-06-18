import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { useAdminClients, type UnifiedClient } from '@/api/admin-clients'
import { useAdminServices, type AdminServiceRow } from '@/api/admin-services'
import { useCreateAdminOrder } from '@/api/admin-orders'
import { PageTransition } from '@/components/ui/PageTransition'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { useCurrency } from '@/hooks/useCurrency'

const STEPS = ['Client', 'Service', 'Amount', 'Review'] as const
type Step = typeof STEPS[number]

export default function OrderNew() {
  const navigate = useNavigate()
  const { formatCurrency } = useCurrency()
  const createOrder = useCreateAdminOrder()

  const [step, setStep] = useState<Step>('Client')
  const [clientSearch, setClientSearch] = useState('')
  const [client, setClient] = useState<UnifiedClient | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [amountUsd, setAmountUsd] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [requirements, setRequirements] = useState('')
  const [deadline, setDeadline] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'INVOICE'>('WALLET')

  const { data: clientResults, isLoading: clientsLoading } = useAdminClients({
    q: clientSearch || undefined,
    limit: 8,
  })

  const { data: services, isLoading: servicesLoading } = useAdminServices()

  // Catalog filtered by the search box (name/category); featured + ordered first.
  const filteredServices = useMemo(() => {
    const all = services ?? []
    const q = serviceSearch.trim().toLowerCase()
    const matched = q
      ? all.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.category ?? '').toLowerCase().includes(q),
        )
      : all
    return [...matched].sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1
      const ao = a.displayOrder ?? 999
      const bo = b.displayOrder ?? 999
      if (ao !== bo) return ao - bo
      return a.name.localeCompare(b.name)
    })
  }, [services, serviceSearch])

  const hasExactMatch = useMemo(
    () =>
      (services ?? []).some(
        (s) => s.name.toLowerCase() === serviceSearch.trim().toLowerCase(),
      ),
    [services, serviceSearch],
  )

  useHeaderConfig(useMemo(() => ({
    title: 'New Order',
    breadcrumbs: [{ label: 'Admin' }, { label: 'Orders', href: '/admin/orders' }, { label: 'New' }],
  }), []))

  const total = (Number(amountUsd) || 0) * (Number(quantity) || 0)
  const stepIndex = STEPS.indexOf(step)
  const canNext =
    (step === 'Client' && client && client.portalMemberId) ||
    (step === 'Service' && serviceName.trim().length > 0) ||
    (step === 'Amount' && total > 0) ||
    step === 'Review'

  const selectService = (s: AdminServiceRow) => {
    setSelectedServiceId(s.id)
    setServiceName(s.name)
    // Prefill the unit price from the catalog if the admin hasn't entered one yet.
    if (!amountUsd && typeof s.basePriceUsd === 'number' && s.basePriceUsd > 0) {
      setAmountUsd(String(s.basePriceUsd))
    }
  }

  const useCustomService = () => {
    setSelectedServiceId(null)
    setServiceName(serviceSearch.trim())
  }

  const submit = async () => {
    if (!client?.portalMemberId) {
      toast.error('Pick a portal-member-backed client')
      return
    }
    if (total <= 0 || !serviceName.trim()) {
      toast.error('Service and amount are required')
      return
    }
    try {
      const created = await createOrder.mutateAsync({
        memberId: client.portalMemberId,
        serviceName: serviceName.trim(),
        amountUsd: Number(amountUsd),
        quantity: Number(quantity) || 1,
        requirements: requirements || undefined,
        deadline: deadline || undefined,
        paymentMethod,
      })
      toast.success(`Order ${created.displayId} created`)
      navigate(`/admin/orders/${encodeURIComponent(created.id)}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Create failed')
    }
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Link to="/admin/orders" className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to orders
          </Link>

          {/* Stepper */}
          <div className="my-5 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const reached = i <= stepIndex
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    reached ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  }`}>{i + 1}</div>
                  <span className={`text-xs ${reached ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200 dark:bg-gray-800" />}
                </div>
              )
            })}
          </div>

          {step === 'Client' && (
            <div className="space-y-3">
              <SearchInput
                value={clientSearch}
                onChange={setClientSearch}
                placeholder="Search by name or email"
              />
              <div className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {clientsLoading && <div className="p-3 text-sm text-gray-400">Searching…</div>}
                {!clientsLoading && (clientResults?.data ?? []).length === 0 && (
                  <div className="p-3 text-sm text-gray-400">No matching clients.</div>
                )}
                {(clientResults?.data ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setClient(c)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      client?.id === c.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium">{c.fullName}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.portalMemberId ? (
                        <Badge variant="success" size="sm">Portal</Badge>
                      ) : (
                        <Badge variant="default" size="sm">CRM only</Badge>
                      )}
                      {c.portalMemberId && (
                        <span className="font-mono text-xs text-gray-500">{formatCurrency(c.walletBalance)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {client && !client.portalMemberId && (
                <p className="text-xs text-amber-600">
                  This client only exists in CRM. To create an order, they must register on the portal first.
                </p>
              )}
            </div>
          )}

          {step === 'Service' && (
            <div className="space-y-3">
              <SearchInput
                value={serviceSearch}
                onChange={setServiceSearch}
                placeholder="Search the service catalog by name or category"
              />
              <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {servicesLoading && <div className="p-3 text-sm text-gray-400">Loading catalog…</div>}
                {!servicesLoading && filteredServices.length === 0 && !serviceSearch.trim() && (
                  <div className="p-3 text-sm text-gray-400">No services in the catalog yet.</div>
                )}
                {filteredServices.map((s) => {
                  const isActive = (s.status ?? 'Active') === 'Active'
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectService(s)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedServiceId === s.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{s.name}</span>
                          {s.featured && <Badge variant="success" size="sm">Featured</Badge>}
                          {!isActive && s.status && <Badge variant="warning" size="sm">{s.status}</Badge>}
                        </div>
                        {s.category && <div className="truncate text-xs text-gray-500">{s.category}</div>}
                      </div>
                      {typeof s.basePriceUsd === 'number' && s.basePriceUsd > 0 && (
                        <span className="shrink-0 font-mono text-xs text-gray-500">{formatCurrency(s.basePriceUsd)}</span>
                      )}
                    </button>
                  )
                })}
                {/* Escape hatch: keep the previous free-text capability for one-off services. */}
                {serviceSearch.trim() && !hasExactMatch && (
                  <button
                    onClick={useCustomService}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedServiceId === null && serviceName === serviceSearch.trim()
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    Use “{serviceSearch.trim()}” as a custom service
                  </button>
                )}
              </div>
              {serviceName && (
                <p className="text-xs text-gray-500">
                  Selected:{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{serviceName}</span>
                  {selectedServiceId === null && ' (custom)'}
                </p>
              )}
            </div>
          )}

          {step === 'Amount' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Unit price (USD)"
                  type="number"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  placeholder="40"
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
              <Input
                label="Deadline (optional)"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <Textarea
                label="Requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="What does the client want?"
                rows={4}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Payment</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="WALLET">Wallet (debits client immediately)</option>
                  <option value="INVOICE">Invoice (payment pending)</option>
                </select>
              </div>
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                Total: <span className="font-mono font-semibold">{formatCurrency(total)}</span>
                {paymentMethod === 'WALLET' && client && (
                  <span className="ml-3 text-xs text-gray-500">
                    Wallet balance: {formatCurrency(client.walletBalance)}
                    {total > client.walletBalance && <span className="ml-2 text-red-600">(insufficient)</span>}
                  </span>
                )}
              </div>
            </div>
          )}

          {step === 'Review' && client && (
            <div className="space-y-2 text-sm">
              <Row label="Client" value={`${client.fullName} (${client.email})`} />
              <Row label="Service" value={serviceName || '—'} />
              <Row label="Unit price" value={formatCurrency(Number(amountUsd) || 0)} />
              <Row label="Quantity" value={quantity} />
              <Row label="Total" value={formatCurrency(total)} />
              <Row label="Payment" value={paymentMethod} />
              {deadline && <Row label="Deadline" value={new Date(deadline).toLocaleString()} />}
              {requirements && <Row label="Requirements" value={requirements} />}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)])}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            {step !== 'Review' ? (
              <Button
                size="sm"
                onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)])}
                disabled={!canNext}
              >
                Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={submit} disabled={createOrder.isPending}>
                <Check className="mr-1 h-3.5 w-3.5" /> {createOrder.isPending ? 'Creating…' : 'Create order'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )
}
