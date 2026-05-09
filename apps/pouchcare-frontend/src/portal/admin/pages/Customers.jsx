import { useState, useEffect, useCallback } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { StatusBadge } from "../../shared/components";
import { useAdminAuth } from "../../shared/auth/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CustomersPage() {
  const { token } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/customers?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const viewDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDetail(data.customer);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminPage title="Customers" description="All registered customers, their licenses, and connected sites.">
      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between">
          <span>Could not load customers: {error}</span>
          <Button size="sm" variant="secondary" onClick={fetchCustomers}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : customers.length === 0 && !error ? (
        <p className="py-12 text-center text-sm text-slate-400">No customers found.</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Customer" },
            { key: "email", label: "Email" },
            { key: "plan", label: "Plan" },
            { key: "licenses", label: "Licenses" },
            { key: "sites", label: "Active Sites" },
            { key: "status", label: "Status" },
            { key: "actions", label: "" },
          ]}
          rows={customers.map((c) => ({
            name: c.name,
            email: <span className="text-xs text-muted">{c.email}</span>,
            plan: c.plan,
            licenses: c.totalLicenses,
            sites: c.totalActiveSites,
            status: <StatusBadge value={c.status === "active" ? "Active" : c.status} />,
            actions: (
              <Button size="sm" variant="secondary" onClick={() => viewDetail(c.id)}>
                View
              </Button>
            ),
          }))}
        />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 border-b border-slate-200 bg-white p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-heading">Customer Detail</h2>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-heading text-xl">&times;</button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-heading">{detail.name}</h3>
                    <p className="text-sm text-muted">{detail.email}</p>
                    <p className="text-xs text-muted mt-1">Plan: {detail.plan} &middot; Joined: {new Date(detail.createdAt).toLocaleDateString()}</p>
                  </div>

                  {detail.licenses?.map((lic) => (
                    <Card key={lic.id} hover={false} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold">{lic.key}</span>
                        <StatusBadge value={lic.status === "active" ? "Active" : lic.status} />
                      </div>
                      <p className="text-xs text-muted mb-3">
                        {lic.plan} &middot; {lic._count?.sites || 0}/{lic.maxSites} sites
                      </p>
                      {lic.sites?.length > 0 && (
                        <div className="space-y-2">
                          {lic.sites.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded border border-slate-100 p-2 text-xs">
                              <div>
                                <span className="font-medium text-heading">{s.name || s.url}</span>
                                <span className="ml-2 text-muted">v{s.pluginVersion}</span>
                              </div>
                              <StatusBadge value={s.status === "active" ? "Active" : s.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Could not load customer details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
