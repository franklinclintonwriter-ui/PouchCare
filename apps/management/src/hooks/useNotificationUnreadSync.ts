import { useEffect } from 'react';
import { useNotifications } from '@/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';

/** Keeps header/mobile nav badge in sync with `GET /notifications` meta. */
export function useNotificationUnreadSync() {
  const { data } = useNotifications();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      setUnreadCount(data.unreadCount);
    }
  }, [data?.unreadCount, setUnreadCount]);
}
