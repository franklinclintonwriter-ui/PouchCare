import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  FileText,
  CreditCard,
  AlertCircle,
  ShoppingCart,
  CalendarOff,
  Trash2,
} from "lucide-react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import {
  useDeleteNotification,
  useDeleteReadNotifications,
  useMarkAllNotificationsRead,
  useMarkOneNotificationRead,
  useNotifications,
} from "@/api/notifications";
import { Card } from "@/components/ui/Card";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { AppNotification } from "@/types/models";
import { formatNotificationTime } from "@/lib/format";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  task: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  leave: <CalendarOff className="h-4 w-4 text-purple-500" />,
  ticket: <FileText className="h-4 w-4 text-amber-500" />,
  payment: <CreditCard className="h-4 w-4 text-emerald-500" />,
  system: <AlertCircle className="h-4 w-4 text-red-500" />,
  order: <ShoppingCart className="h-4 w-4 text-cyan-500" />,
};

function groupByDate(
  notifications: AppNotification[],
): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};
  for (const n of notifications) {
    const date = new Date(n.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

export default function NotificationList() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markOne = useMarkOneNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const deleteRead = useDeleteReadNotifications();
  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const headerConfig = useMemo(
    () => ({
      title: "Notifications",
      breadcrumbs: [{ label: "Notifications", icon: Bell }],
      actions: [
        {
          type: "button" as const,
          label: "Mark all read",
          onClick: async () => {
            try {
              await markAll.mutateAsync();
              toast.success("All notifications marked as read");
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to mark all as read",
              );
            }
          },
          disabled: unreadCount === 0 || markAll.isPending,
        },
        {
          type: "button" as const,
          label: "Clear read",
          icon: Trash2,
          variant: "outline" as const,
          onClick: async () => {
            try {
              await deleteRead.mutateAsync();
              toast.success("Read notifications cleared");
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to clear notifications",
              );
            }
          },
          disabled: notifications.length === 0 || deleteRead.isPending,
        },
      ],
    }),
    [markAll, deleteRead, unreadCount, notifications.length],
  );
  useHeaderConfig(headerConfig);

  const grouped = useMemo(
    () => groupByDate(notifications ?? []),
    [notifications],
  );

  if (isLoading) {
    return (
      <PageTransition className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {dateLabel}
          </p>
          <div className="space-y-2">
            {items.map((notif) => (
              <button
                key={notif.id}
                onClick={async () => {
                  try {
                    if (!notif.read) {
                      await markOne.mutateAsync(notif.id);
                    }
                  } catch {
                    // Ignore mark-read failures and still allow navigation.
                  }
                  if (notif.resourceUrl) navigate(notif.resourceUrl);
                }}
                className={`flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition-all duration-150
                  hover:shadow-card dark:bg-gray-800/80
                  ${
                    !notif.read
                      ? "border-l-4 border-l-primary-500 border-t-gray-200/80 border-r-gray-200/80 border-b-gray-200/80 dark:border-t-gray-700/60 dark:border-r-gray-700/60 dark:border-b-gray-700/60"
                      : "border-gray-200/80 dark:border-gray-700/60"
                  }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  {typeIcons[notif.type] ?? (
                    <Bell className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${!notif.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatNotificationTime(notif.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await markOne.mutateAsync(notif.id);
                          toast.success("Notification marked as read");
                        } catch (err) {
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : "Failed to mark read",
                          );
                        }
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deleteOne.mutateAsync(notif.id);
                        toast.success("Notification deleted");
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Failed to delete notification",
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {!notif.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </PageTransition>
  );
}
