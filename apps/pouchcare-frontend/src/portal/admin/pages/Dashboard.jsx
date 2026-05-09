import { useState, useCallback } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import StatCard from "../../../components/ui/StatCard";
import DataTable from "../../../components/ui/DataTable";
import { StatusBadge } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";
import UpdateNotice from "../components/UpdateNotice";

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
  const activeCompanies = data.companies.filter((c) => c.status === "Active").length;
  const monthlyRevenue = data.companies.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);

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
      description="Operational overview for all companies, billing health, and platform activity."
      actions={<Button size="sm">Create Company</Button>}
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
        <StatCard label="Total Companies" value={String(data.companies.length)} hint="Managed accounts" />
        <StatCard label="Active Companies" value={String(activeCompanies)} hint="Live on production" />
        <StatCard label="Monthly Revenue" value={`$${monthlyRevenue}`} hint="Approx MRR" />
        <StatCard label="Open Invoices" value={String(data.billingRecords.filter((b) => b.status !== "Paid").length)} hint="Needs follow-up" />
      </div>

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
