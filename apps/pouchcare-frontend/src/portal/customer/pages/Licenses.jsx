import { useState, useEffect, useCallback } from "react";
import AdminPage from "../../../components/ui/PageShell";
import Card from "../../../components/ui/Card";
import DataTable from "../../../components/ui/DataTable";
import { StatusBadge } from "../../shared/components";
import { useCustomerAuth } from "../auth/CustomerAuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function LicensesPage() {
  const { token } = useCustomerAuth();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const fetchLicenses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/licenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load licenses");
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <AdminPage title="Licenses" description="Your PouchCare license keys and activation status.">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Licenses" description="Your PouchCare license keys and activation status.">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {licenses.length === 0 ? (
        <Card hover={false} className="p-8 text-center">
          <h3 className="text-lg font-semibold text-heading">No licenses yet</h3>
          <p className="mt-2 text-sm text-muted">
            Contact your account manager or purchase a plan to receive a license key.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {licenses.map((lic) => (
            <Card key={lic.id} hover={false} className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-bold text-heading">{lic.key}</h3>
                    <button
                      onClick={() => copyKey(lic.key)}
                      className="rounded px-2 py-0.5 text-xs text-primary hover:bg-blue-50 transition-colors"
                    >
                      {copied === lic.key ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {lic.plan} plan &middot; {lic.activeSites}/{lic.maxSites} sites activated
                    {lic.expiresAt && ` · Expires ${new Date(lic.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <StatusBadge value={lic.status === "active" ? "Active" : lic.status} />
              </div>

              {/* Activation progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Activations</span>
                  <span>{lic.activeSites} / {lic.maxSites}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (lic.activeSites / lic.maxSites) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sites under this license */}
              {lic.sites.length > 0 && (
                <DataTable
                  columns={[
                    { key: "url", label: "Site" },
                    { key: "pluginVersion", label: "Plugin" },
                    { key: "status", label: "Status" },
                    { key: "lastHeartbeat", label: "Last Seen" },
                  ]}
                  rows={lic.sites.map((s) => ({
                    url: (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                        {s.name || new URL(s.url).hostname}
                      </a>
                    ),
                    pluginVersion: `v${s.pluginVersion || "—"}`,
                    status: <StatusBadge value={s.status === "active" ? "Active" : s.status} />,
                    lastHeartbeat: s.lastHeartbeat
                      ? new Date(s.lastHeartbeat).toLocaleDateString()
                      : "Never",
                  }))}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
