import { useNotificationUnreadSync } from '@/hooks/useNotificationUnreadSync';
import { NotificationPanel } from './NotificationPanel';

/** Mount next to `<Header />`: syncs badge + renders the header-aligned notification popover. */
export function NotificationBridge() {
  useNotificationUnreadSync();
  return <NotificationPanel />;
}
