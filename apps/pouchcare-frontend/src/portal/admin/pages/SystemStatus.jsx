import { useState, useEffect, useCallback } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { StatusBadge, MetricTile, OpsPanel } from "../../shared/components";
import { useAdminAuth } from "../auth/AdminAuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function SystemStatusPage() {
  const { token } = useAdminAuth();
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchSystem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/system`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSystem(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || "Failed to fetch system status");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchSystem();
  }, [token, fetchSystem]);

  const formatUptime = (seconds) => {
    if (!seconds) return "N/A";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const healthChecks = system
    ? [
        {
          id: "api",
          name: "API Server",
          endpoint: "/admin/system",
          latency: "—",
          status: system.api?.status || "unknown",
          checkedAt: lastChecked || "—",
        },
        {
          id: "db",
          name: "Database",
          endpoint: "PostgreSQL / SQLite",
          latency: `${system.database?.latency ?? "—"}ms`,
          status: system.database?.status || "unknown",
          checkedAt: lastChecked || "—",
        },
      ]
    : [];

  const dbTables = system?.database?.tables
    ? Object.entries(system.database.tables).map(([table, count]) => ({
        table,
        rows: String(count),
      }))
    : [];

  return (
    <AdminPage
      title="System Status"
      description="Runtime health, database, and memory diagnostics."
      actions={
        <Button size="sm" onClick={fetchSystem} disabled={loading}>
          {loading ? "Checking..." : "Run Checks"}
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load system status: {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <MetricTile
          label="API Status"
          value={system?.api?.status || (loading ? "Loading..." : "Unknown")}
          hint="Server health"
        />
        <MetricTile
          label="Uptime"
          value={system ? formatUptime(system.api?.uptime) : "—"}
          hint="Since last restart"
        />
        <MetricTile
          label="DB Latency"
          value={system ? `${system.database?.latency ?? "—"}ms` : "—"}
          hint="Database query time"
        />
        <MetricTile
          label="Heap Used"
          value={system ? `${system.memory?.heapUsed ?? "—"} MB` : "—"}
          hint={system ? `of ${system.memory?.heapTotal ?? "—"} MB total` : "Memory usage"}
        />
      </div>

      <OpsPanel title="Health Endpoints" subtitle="Live checks against API and database.">
        {loading && !system ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading health checks...</p>
        ) : (
          <DataTable
            columns={[
              { key: "service", label: "Service" },
              { key: "endpoint", label: "Endpoint" },
              { key: "latency", label: "Latency" },
              { key: "status", label: "Status" },
              { key: "checkedAt", label: "Checked" },
            ]}
            rows={healthChecks.map((item) => ({
              service: item.name,
              endpoint: item.endpoint,
              latency: item.latency,
              status: (
                <StatusBadge
                  value={item.status === "healthy" ? "Active" : "Suspended"}
                />
              ),
              checkedAt: item.checkedAt,
            }))}
          />
        )}
      </OpsPanel>

      {system && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <OpsPanel title="Database Tables" subtitle="Row counts per table.">
            <DataTable
              columns={[
                { key: "table", label: "Table" },
                { key: "rows", label: "Rows" },
              ]}
              rows={dbTables}
            />
          </OpsPanel>

          <OpsPanel title="Runtime Info" subtitle="Node.js and platform details.">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Node.js</span>
                <span className="font-medium text-slate-800">{system.node || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Platform</span>
                <span className="font-medium text-slate-800">{system.platform || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">API Version</span>
                <span className="font-medium text-slate-800">{system.api?.version || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">RSS Memory</span>
                <span className="font-medium text-slate-800">{system.memory?.rss ?? "—"} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DB Status</span>
                <span className="font-medium text-slate-800">{system.database?.status || "—"}</span>
              </div>
            </div>
          </OpsPanel>
        </div>
      )}
    </AdminPage>
  );
}
