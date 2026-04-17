/**
 * /admin/billing/commissions — admin wrapper that mounts the existing PortalCommissions page
 * inside the new Admin Panel namespace.
 */
import PortalCommissions from '@/pages/portal/admin/PortalCommissions'

export default function CommissionsAdmin() {
  return <PortalCommissions />
}
