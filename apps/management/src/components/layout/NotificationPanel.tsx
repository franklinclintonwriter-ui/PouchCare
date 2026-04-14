import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  FileText,
  CreditCard,
  AlertCircle,
  ShoppingCart,
  CalendarOff,
  ExternalLink,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useNotifications, useMarkOneNotificationRead, useMarkAllNotificationsRead } from '@/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/utils/cn';
import { formatNotificationTime } from '@/lib/format';
import type { AppNotification } from '@/types/models';

const typeIcons: Record<string, React.ReactNode> = {
  task: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  leave: <CalendarOff className="h-4 w-4 text-purple-500" />,
  ticket: <FileText className="h-4 w-4 text-amber-500" />,
  payment: <CreditCard className="h-4 w-4 text-emerald-500" />,
  system: <AlertCircle className="h-4 w-4 text-red-500" />,
  order: <ShoppingCart className="h-4 w-4 text-cyan-500" />,
};

const PREVIEW_LIMIT = 8;

function NotificationPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, closePanel } = useNotificationStore();
  const { data, isLoading } = useNotifications();
  const markOne = useMarkOneNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const list = data?.notifications ?? [];
  const preview = list.slice(0, PREVIEW_LIMIT);
  const markAllBusy = markAll.isPending;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (isOpen) closePanel();
    // Close any open sheet/popover after route navigation.
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleItem = (n: AppNotification) => {
    const go = () => {
      closePanel();
      if (n.resourceUrl) navigate(n.resourceUrl);
    };
    if (!n.read) {
      markOne.mutate(n.id, { onSettled: go });
    } else {
      go();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notification-layer"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            'fixed inset-0 z-[100] flex items-start justify-end',
            // Align with sticky header + horizontal padding (matches Header: px-3 lg:px-5, h-14 lg:h-16)
            'pt-14 pl-3 pr-3 lg:pt-16 lg:pl-5 lg:pr-5',
          )}
        >
          <motion.button
            type="button"
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px] dark:bg-black/40"
            onClick={() => closePanel()}
          />

          <div
            className={cn(
              'relative z-[1] flex w-[min(100%,22rem)] max-w-[22rem] flex-col',
              'max-h-[min(72dvh,560px)]',
              'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
            )}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-panel-title"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className={cn(
                'flex max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900',
              )}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="min-w-0">
                  <h2 id="notification-panel-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {data?.unreadCount ? `${data.unreadCount} unread` : 'You’re all caught up'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {(data?.unreadCount ?? 0) > 0 && (
                    <button
                      type="button"
                      disabled={markAllBusy}
                      onClick={() => markAll.mutate()}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
                    >
                      {markAll.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5" />
                      )}
                      Mark all
                    </button>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => closePanel()}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    View all
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </Link>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                {isLoading ? (
                  <ul className="space-y-2 p-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="flex gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2 pt-0.5">
                          <div className="h-3 w-[85%] max-w-[12rem] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-2 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : preview.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                      <Bell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">No notifications yet</p>
                    <p className="max-w-[240px] text-[11px] text-gray-500">We’ll show alerts for tasks, leave, and orders here.</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {preview.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleItem(n)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors',
                            'min-h-[48px] touch-manipulation',
                            'hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800/80 dark:active:bg-gray-800',
                            !n.read && 'bg-primary-50/60 dark:bg-primary-950/20',
                          )}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            {typeIcons[n.type] ?? <Bell className="h-4 w-4 text-gray-400" />}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p
                              className={cn(
                                'line-clamp-2 text-[13px] leading-snug',
                                !n.read ? 'font-semibold text-gray-900 dark:text-gray-50' : 'text-gray-700 dark:text-gray-300',
                              )}
                            >
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                              {formatNotificationTime(n.timestamp)}
                            </p>
                          </div>
                          {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {list.length > PREVIEW_LIMIT && (
                <div className="shrink-0 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                  <Link
                    to="/notifications"
                    onClick={() => closePanel()}
                    className="block w-full rounded-lg py-2 text-center text-[12px] font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30"
                  >
                    Show {list.length - PREVIEW_LIMIT} more in inbox
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export { NotificationPanel };
