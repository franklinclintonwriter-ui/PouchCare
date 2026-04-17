/**
 * /admin/billing/invoices — admin wrapper that mounts the existing finance/InvoiceList page
 * inside the new Admin Panel namespace. Provides a single billing entry point per the
 * Notion §2.5 plan ("Billing module").
 */
import InvoiceList from '@/pages/finance/InvoiceList'

export default function InvoicesAdmin() {
  return <InvoiceList />
}
