// @pouchcare/utils — Shared utility functions

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0
  }).format(amount)
}

export function formatDate(date: string | Date, fmt?: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, n = 40): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export const STATUS_COLORS = {
  active: 'green', online: 'green', paid: 'green', done: 'green',
  pending: 'yellow', 'in progress': 'sky', review: 'sky',
  blocked: 'red', rejected: 'red', overdue: 'red',
  inactive: 'gray', draft: 'gray',
} as const
