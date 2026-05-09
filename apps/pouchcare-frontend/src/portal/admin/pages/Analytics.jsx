/**
 * @file Analytics dashboard for the admin portal.
 * Fetches real data from GET /admin/analytics.
 */

import { useState, useEffect, useCallback } from "react";
import PageShell from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Select from "../../../components/ui/Select";
import { MetricTile, OpsPanel, SparkLine, BarChart, DonutChart } from "../../shared/components";
import { useAdminAuth } from "../auth/AdminAuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const PLAN_COLORS = {
  starter: "#6366f1",
  growth: "#22c55e",
  agency: "#f59e0b",
  enterprise: "#ef4444",
};

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export default function AnalyticsPage() {
  const { token } = useAdminAuth();
  const [range, setRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [token, fetchAnalytics]);

  // Derive chart data from API response
  const dailySignupData = analytics?.dailySignups
    ? Object.entries(analytics.dailySignups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, count]) => count)
    : [];

  const planData = analytics?.plans
    ? Object.entries(analytics.plans).map(([plan, count]) => ({
        label: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count,
        color: PLAN_COLORS[plan] || "#94a3b8",
      }))
    : [];

  const dailyLabels = analytics?.dailySignups
    ? Object.keys(analytics.dailySignups)
        .sort()
        .map((d) => d.slice(5)) // "MM-DD"
    : [];

  const barData = dailyLabels.map((label, i) => ({
    label,
    value: dailySignupData[i] || 0,
  }));

  const overview = analytics?.overview || {};

  return (
    <PageShell
      title="Analytics"
      description="Platform-wide customer, site, and license insights."
      actions={
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load analytics: {error}
        </div>
      )}

      {loading && !analytics ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading analytics...</p>
      ) : (
        <>
          {/* Overview Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Total Customers"
              value={overview.totalCustomers ?? "—"}
              hint="All registered customers"
            />
            <MetricTile
              label="New This Month"
              value={overview.newCustomersMonth ?? "—"}
              hint="Registered in last 30 days"
            />
            <MetricTile
              label="Active Sites"
              value={overview.activeSites ?? "—"}
              hint={`of ${overview.totalSites ?? 0} total`}
            />
            <MetricTile
              label="Active Licenses"
              value={overview.totalLicenses ?? "—"}
              hint="Currently active"
            />
          </div>

          {/* Signup Trend + Plan Distribution */}
          <div className="grid gap-4 lg:grid-cols-2">
            <OpsPanel title="Daily Signups" subtitle="New customers (last 30 days)">
              {dailySignupData.length > 0 ? (
                <SparkLine data={dailySignupData} width={500} height={80} color="#6366f1" />
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">No signup data available</p>
              )}
            </OpsPanel>

            <OpsPanel title="Plan Distribution" subtitle="Active licenses by plan">
              {planData.length > 0 ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <DonutChart segments={planData} size={180} />
                  <ul className="space-y-2 text-sm">
                    {planData.map((s) => (
                      <li key={s.label} className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-slate-700">
                          {s.label} ({s.value})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">No plan data available</p>
              )}
            </OpsPanel>
          </div>

          {/* Signup Bar Chart */}
          {barData.length > 0 && (
            <OpsPanel title="Signups by Day" subtitle="Bar chart of daily customer registrations">
              <BarChart data={barData} width={500} height={180} barColor="#6366f1" />
            </OpsPanel>
          )}

          {/* Quick Stats Table */}
          <OpsPanel title="Quick Stats" subtitle="Key metrics at a glance">
            <DataTable
              columns={[
                { key: "metric", label: "Metric" },
                { key: "value", label: "Value" },
              ]}
              rows={[
                { metric: "Total Customers", value: String(overview.totalCustomers ?? 0) },
                { metric: "New This Week", value: String(overview.newCustomersWeek ?? 0) },
                { metric: "New This Month", value: String(overview.newCustomersMonth ?? 0) },
                { metric: "Total Sites", value: String(overview.totalSites ?? 0) },
                { metric: "Active Sites", value: String(overview.activeSites ?? 0) },
                { metric: "Active Licenses", value: String(overview.totalLicenses ?? 0) },
              ]}
            />
          </OpsPanel>
        </>
      )}
    </PageShell>
  );
}
