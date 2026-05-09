import AdminPage from "../../../components/ui/PageShell";
import StatCard from "../../../components/ui/StatCard";
import KpiGrid from "../../../components/ui/KpiGrid";
import DataTable from "../../../components/ui/DataTable";
import { StatusBadge } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function CustomerDashboardPage() {
  const { data, markNotificationRead } = useCustomerPortal();

  const websites = data.websites || [];
  const subscriptions = data.subscriptions || [];
  const plugins = data.plugins || [];
  const notifications = data.notifications || [];
  const activity = data.activity || [];

  const activityRows = activity.map((a) => ({
    action: a.action,
    actor: a.actor,
    updated: a.updated,
  }));

  return (
    <AdminPage
      title="Customer Dashboard"
      description="Overview of your websites, subscriptions, notifications, and account activity."
    >
      <KpiGrid>
        <StatCard label="Websites" value={String(websites.length)} hint="Managed in your account" />
        <StatCard label="Subscriptions" value={String(subscriptions.length)} hint="Plans and add-ons" />
        <StatCard label="Plugins" value={String(plugins.length)} hint="Installed and managed" />
        <StatCard label="Unread Alerts" value={String(notifications.filter((n) => !n.read).length)} hint="Action required" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={[
              { key: "action", label: "Recent Activity" },
              { key: "actor", label: "Actor" },
              { key: "updated", label: "Time" },
            ]}
            rows={activityRows}
            emptyMessage="No recent activity."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <div className="mt-3 space-y-2">
            {notifications.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">No notifications</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <StatusBadge value={n.level === "success" ? "Active" : n.level === "warning" ? "Paused" : "Draft"} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{n.updated}</p>
                {!n.read ? (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="mt-2 text-xs font-medium text-primary"
                  >
                    Mark as read
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600">Read</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
