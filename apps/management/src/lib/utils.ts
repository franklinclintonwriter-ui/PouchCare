import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = "MMM dd, yyyy") {
  return format(new Date(date), fmt)
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount)
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    active: "green", online: "green", paid: "green", verified: "green", done: "green", delivered: "green", approved: "green", completed: "green",
    pending: "yellow", "in progress": "sky", review: "sky", processing: "sky", partial: "yellow", "on leave": "yellow",
    blocked: "red", rejected: "red", overdue: "red", cancelled: "red", inactive: "gray", draft: "gray",
  }
  return map[status.toLowerCase()] ?? "gray"
}

export function truncate(str: string, n = 40) {
  return str.length > n ? str.slice(0, n) + "…" : str
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

