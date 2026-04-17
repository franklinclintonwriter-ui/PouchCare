/**
 * /admin/billing/deposits — admin wrapper that mounts the existing PortalDeposits page
 * inside the new Admin Panel namespace. Behavior, data, and audit are unchanged.
 */
import PortalDeposits from '@/pages/portal/admin/PortalDeposits'

export default function Deposits() {
  return <PortalDeposits />
}
