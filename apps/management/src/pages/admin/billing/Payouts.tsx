/**
 * /admin/billing/payouts — admin wrapper that mounts the existing PortalPayouts page
 * inside the new Admin Panel namespace.
 */
import PortalPayouts from '@/pages/portal/admin/PortalPayouts'

export default function Payouts() {
  return <PortalPayouts />
}
