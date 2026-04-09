import { useNotificationUnreadSync } from '@/hooks/useNotificationUnreadSync';
import { NotificationPanel } from './NotificationPanel';

/** Mount next to `<Header />`: syncs badge + renders the notification popover/sheet. */
export function NotificationBridge() {
  useNotificationUnreadSync();
  return <NotificationPanel />;
}
