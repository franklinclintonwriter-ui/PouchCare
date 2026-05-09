import { useState, useEffect, useCallback } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import StatCard from "../../../components/ui/StatCard";
import Button from "../../../components/ui/Button";
import { StatusBadge } from "../../shared/components";
import { useAdminAuth } from "../../shared/auth/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function InstallationsPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token || ""}` };
      const [statsRes, sitesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers }),
        fetch(`${API_BASE}/admin/sites?limit=50`, { headers }),
      ]);

      if (!statsRes.ok && !sitesRes.ok) throw new Error(`HTTP ${statsRes.status}`);
      if (statsRes.ok) setStats(await statsRes.json());
      if (sitesRes.ok) {
        const data = await sitesRes.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load installation data");
      setStats(null);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <AdminPage title="Installations" description="All WordPress sites running PouchCare.">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminPage>
    );
  }

  const o = stats?.overview || {};

  return (
    <AdminPage title="Installations" description="All WordPress sites running PouchCare theme and plugins.">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between">
          <span>Could not load installations: {error}</span>
          <Button size="sm" variant="secondary" onClick={fetchData}>Retry</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sites" value={String(o.totalSites || 0)} hint="All registered sites" />
        <StatCard label="Active Sites" value={String(o.activeSites || 0)} hint="Sending heartbeats" />
        <StatCard label="Active Last 24h" value={String(o.recentlyActive || 0)} hint="Recent heartbeat" />
        <StatCard label="Stale (7+ days)" value={String(o.staleSites || 0)} hint="May need attention" />
      </div>

      {stats?.versions && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Plugin Versions", data: stats.versions.plugin },
            { title: "Theme Versions", data: stats.versions.theme },
            { title: "WordPress Versions", data: stats.versions.wordpress },
          ].map(({ title, data }) => (
            <div key={title} className="rounded-card border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-heading">{title}</h3>
              <div className="space-y-2">
                {Object.entries(data || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([version, count]) => {
                    const total = Object.values(data).reduce((s, v) => s + v, 0);
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={version}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-heading">v{version}</span>
                          <span className="text-muted">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.plans && (
        <div className="mt-6 rounded-card border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-heading">License Plans</h3>
          <div className="flex gap-6">
            {Object.entries(stats.plans).map(([plan, count]) => (
              <div key={plan} className="text-center">
                <div className="text-2xl font-bold text-heading">{count}</div>
                <div className="text-xs text-muted">{plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sites.length > 0 && (
        <div className="mt-6">
          <DataTable
            columns={[
              { key: "site", label: "Site" },
              { key: "customer", label: "Customer" },
              { key: "plugin", label: "Plugin" },
              { key: "wp", label: "WordPress" },
              { key: "plan", label: "Plan" },
              { key: "status", label: "Status" },
              { key: "lastSeen", label: "Last Seen" },
            ]}
            rows={sites.map((s) => ({
              site: (
                <div>
                  <div className="text-sm font-medium text-heading">{s.name || s.url}</div>
                  <div className="text-xs text-muted">{s.url}</div>
                </div>
              ),
              customer: (
                <div className="text-xs">
                  <div className="font-medium">{s.customer?.name}</div>
                  <div className="text-muted">{s.customer?.email}</div>
                </div>
              ),
              plugin: `v${s.pluginVersion || "—"}`,
              wp: s.wpVersion || "—",
              plan: s.plan,
              status: <StatusBadge value={s.status === "active" ? "Active" : s.status} />,
              lastSeen: timeAgo(s.lastHeartbeat),
            }))}
          />
        </div>
      )}

      {!error && !stats && sites.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">No installation data available.</p>
      )}
    </AdminPage>
  );
}
