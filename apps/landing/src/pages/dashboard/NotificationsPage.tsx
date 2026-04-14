/**
 * Notifications inbox — paginated list of user notifications with read/unread states.
 * Route: /dashboard/notifications
 */
import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  usePortalNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/api/portal-dashboard";
import { cn } from "@/lib/cn";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePortalNotifications(page, 20);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Notifications
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Stay up to date with your orders, wallet, and account activity.
          </p>
        </div>
        {items.some((n: any) => !n.read) && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Bell className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            No notifications yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            We'll notify you about orders, payments, and account updates.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {items.map((n: any) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                !n.read && "border-l-[3px] border-l-primary-500 bg-primary-50/40"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  n.read ? "bg-gray-100" : "bg-primary-100"
                )}
              >
                <Bell
                  className={cn(
                    "h-4 w-4",
                    n.read ? "text-gray-400" : "text-primary-600"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    n.read ? "text-gray-600" : "font-semibold text-gray-900"
                  )}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                  {n.message}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {timeAgo(n.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
