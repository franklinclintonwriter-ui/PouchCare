/**
 * /admin/broadcast — admin wrapper that mounts the existing BroadcastList page
 * inside the Admin Panel namespace. Per Notion §2.8 the Phase 4 wrapper is
 * intentionally thin; segment-aware recipient picker is a follow-up that hooks
 * into the URL-encoded ClientsList segments shipped this turn.
 */
import BroadcastList from '@/pages/broadcast/BroadcastList'

export default function BroadcastAdmin() {
  return <BroadcastList />
}
