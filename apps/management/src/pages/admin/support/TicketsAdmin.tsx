/**
 * /admin/support — admin wrapper that mounts the existing support/TicketList page
 * inside the new Admin Panel namespace. Per Notion §2.6, an explicit `?clientId=` filter
 * can be appended by ClientDetail's "Tickets" tab to scope to a single client.
 */
import TicketList from '@/pages/support/TicketList'

export default function TicketsAdmin() {
  return <TicketList />
}
