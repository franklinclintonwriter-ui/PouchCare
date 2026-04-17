/**
 * Notifications inbox — paginated list with read/unread states.
 * Route: /dashboard/notifications
 *
 * Migrated (Week 4) to the shared UI kit: `timeAgo` moved to lib/date.ts,
 * pagination now uses the shared `<Pagination>` primitive with first/last +
 * jump-to-page, the header shows a live unread-count badge, and the empty /
 * loading / error states use the standard primitives.
 */
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  usePortalNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type PortalNotification,
} from "@/api/portal-notifications";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/date";
import {
  Skeleton,
  EmptyState,
  ErrorState,
  Pagination,
} from "@/components/ui";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const query = usePortalNotifications(page, PAGE_SIZE);
  const { data, isLoading, isError } = query;
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? items.length;
  const unreadOnPage = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
              Notifications
            </h1>
            {unreadOnPage > 0 && (
              <span
                aria-label={`${unreadOnPage} unread on this page`}
                className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold text-white"
              >
                {unreadOnPage}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Stay up to date with your orders, wallet, and account activity.
          </p>
        </div>
        {unreadOnPage > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3"
            >
              <Skeleton shape="circle" className="h-8 w-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="No notifications yet"
          description="We'll notify you about orders, payments, and account updates."
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          {items.map((n: PortalNotification) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              aria-label={n.read ? n.title : `${n.title} — mark as read`}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
                !n.read && "border-l-[3px] border-l-primary-500 bg-primary-50/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  n.read ? "bg-gray-100 dark:bg-gray-800" : "bg-primary-100",
                )}
              >
                <Bell
                  className={cn(
                    "h-4 w-4",
                    n.read ? "text-gray-400" : "text-primary-600",
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    n.read
                      ? "text-gray-600 dark:text-gray-400"
                      : "font-semibold text-gray-900 dark:text-gray-100",
                  )}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {n.message}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] text-gray-400"
                title={new Date(n.createdAt).toLocaleString()}
              >
                {timeAgo(n.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={setPage}
      />
    </div>
  );
}
