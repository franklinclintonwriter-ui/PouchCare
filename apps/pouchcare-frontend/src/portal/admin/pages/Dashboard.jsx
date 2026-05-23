import { useEffect, useState, useCallback } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import StatCard from "../../../components/ui/StatCard";
import DataTable from "../../../components/ui/DataTable";
import { StatusBadge } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";
import UpdateNotice from "../components/UpdateNotice";
import { useAdminAuth } from "../../shared/auth/AuthContext";
import { getNodeApiBase } from "../../../config/apiBase";
import { Link } from "react-router-dom";
import { adminPath } from "../../../config/runtime";

/**
 * Check whether an update notice should be shown.
 * Uses the global flag set by PHP or falls back to a simulated state.
 * @returns {{ available: boolean, currentVersion: string, newVersion: string, changelog: string[] }}
 */
function getUpdateInfo() {
  const global = /** @type {any} */ (window).__POUCHCARE_UPDATE_AVAILABLE__;
  if (global) {
    return {
      available: true,
      currentVersion: global.currentVersion ?? "1.0.0",
      newVersion: global.newVersion ?? "1.1.0",
      changelog: global.changelog ?? [],
    };
  }
  return { available: false, currentVersion: "1.0.0", newVersion: "1.0.0", changelog: [] };
}

export default function AdminDashboardPage() {
  const { data } = useAdminPortal();
  const { token } = useAdminAuth();
  const [platformStats, setPlatformStats] = useState(null);
  const [statsLoadError, setStatsLoadError] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const monthlyRevenue = data.companies.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);
  const openInvoices = data.billingRecords.filter((b) => b.status !== "Paid").length;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const base = getNodeApiBase();
        if (!base) return;
        const res = await fetch(`${base}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setPlatformStats(json);
          setStatsLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setPlatformStats(null);
          setStatsLoadError(true);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const ov = platformStats?.overview;

  const [updateInfo] = useState(getUpdateInfo);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const handleUpdate = useCallback(async () => {
    try {
      await fetch("/wp-json/pouchcare/v1/updates/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component: "pouchcare-builder" }),
      });
      setUpdateDismissed(true);
    } catch {
      // Silently handled
    }
  }, []);

  return (
    <AdminPage
      title="Dashboard"
      description="Database metrics (top) when the API is available; workspace snapshot (CRM) in the table below."
      actions={
        <Button as={Link} to={adminPath("/companies")} size="sm">
          Manage companies
        </Button>
      }
    >
      {updateInfo.available && !updateDismissed && (
        <UpdateNotice
          currentVersion={updateInfo.currentVersion}
          newVersion={updateInfo.newVersion}
          changelog={updateInfo.changelog}
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateDismissed(true)}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customers (platform)"
          value={
            ov
              ? String(ov.totalCustomers)
              : !token
                ? "—"
                : statsLoading
                  ? "…"
                  : statsLoadError
                    ? "—"
                    : "—"
          }
          hint={
            ov
              ? "Users with customer role"
              : !token
                ? "Log in for live API metrics"
                : statsLoadError
                  ? "API unreachable"
                  : statsLoading
                    ? "Loading…"
                    : "No data"
          }
        />
        <StatCard
          label="Active licenses"
          value={ov ? String(ov.activeLicenses) : !token ? "—" : statsLoading ? "…" : statsLoadError ? "—" : "—"}
          hint={ov ? `of ${ov.totalLicenses} total` : "From API when available"}
        />
        <StatCard
          label="Connected sites"
          value={ov ? String(ov.activeSites) : !token ? "—" : statsLoading ? "…" : statsLoadError ? "—" : "—"}
          hint={ov ? `${ov.recentlyActive} sites with heartbeat in 24h` : "From API when available"}
        />
        <StatCard label="MRR (snapshot)" value={`$${monthlyRevenue}`} hint="Approx from workspace" />
      </div>

      {openInvoices > 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          Open invoices (snapshot): <strong>{openInvoices}</strong>
        </p>
      ) : null}

      <h3 className="mt-8 text-sm font-semibold text-slate-800">Workspace companies (CRM snapshot)</h3>
      <p className="mb-3 text-xs text-slate-500">Synced via admin snapshot; not the same as platform customer accounts.</p>

      <DataTable
        columns={[
          { key: "company", label: "Company" },
          { key: "plan", label: "Plan" },
          { key: "status", label: "Status" },
          { key: "websites", label: "Websites" },
          { key: "updated", label: "Updated" },
        ]}
        rows={data.companies.map((c) => ({
          company: c.name,
          plan: c.plan,
          status: <StatusBadge value={c.status} />,
          websites: c.websites,
          updated: c.updated,
        }))}
      />
    </AdminPage>
  );
}
