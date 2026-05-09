import { useState, useEffect, useCallback } from "react";
import AdminPage from "../../../components/ui/PageShell";
import Card from "../../../components/ui/Card";
import { StatusBadge } from "../../shared/components";
import { useCustomerAuth } from "../auth/CustomerAuthContext";

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

function heartbeatStatus(dateStr) {
  if (!dateStr) return "unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 24 * 60 * 60 * 1000) return "Active";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "Warning";
  return "Inactive";
}

export default function SitesPage() {
  const { token } = useCustomerAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load sites");
      const data = await res.json();
      setSites(data.sites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  if (loading) {
    return (
      <AdminPage title="Connected Sites" description="WordPress sites using your PouchCare license.">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Connected Sites" description="WordPress sites using your PouchCare license.">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {sites.length === 0 ? (
        <Card hover={false} className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-heading">No sites connected yet</h3>
          <p className="mt-2 text-sm text-muted">
            Install the PouchCare plugin on your WordPress site and activate it with your license key to see it here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const hbStatus = heartbeatStatus(site.lastHeartbeat);
            return (
              <Card key={site.id} className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-heading">
                      {site.name || new URL(site.url).hostname}
                    </h3>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-primary hover:underline"
                    >
                      {site.url}
                    </a>
                  </div>
                  <StatusBadge value={hbStatus} />
                </div>

                <div className="space-y-2 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Plugin</span>
                    <span className="font-medium text-heading">v{site.pluginVersion || "—"}</span>
                  </div>
                  {site.themeActive && (
                    <div className="flex justify-between">
                      <span>Theme</span>
                      <span className="font-medium text-heading">v{site.themeVersion || "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>WordPress</span>
                    <span className="font-medium text-heading">{site.wpVersion || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last heartbeat</span>
                    <span className="font-medium text-heading">{timeAgo(site.lastHeartbeat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License</span>
                    <span className="font-mono text-heading">{site.license?.key?.slice(0, 10)}...</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
