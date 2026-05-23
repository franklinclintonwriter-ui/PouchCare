import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { CrudActions, CrudCreateForm, StatusBadge } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";
import CompanyDetail from "./CompanyDetail";

export default function CompaniesPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { data, createCompany, deleteCompany, suspendCompany, activateCompany } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ name: "", ownerEmail: "", plan: "Starter", status: "Trial" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.companies.filter((c) => {
      const okStatus = statusFilter === "all" ? true : c.status === statusFilter;
      const okQuery = q ? `${c.name} ${c.ownerEmail}`.toLowerCase().includes(q) : true;
      return okStatus && okQuery;
    });
  }, [data.companies, query, statusFilter]);

  if (companyId) {
    return (
      <AdminPage
        title="Company Detail"
        description="Operational controls, limits, subscriptions, invoices, and internal activity."
      >
        <CompanyDetail companyId={companyId} onBack={() => navigate("..")} />
      </AdminPage>
    );
  }

  const rows = filtered.map((c) => ({
    name: c.name,
    plan: c.plan,
    owner: c.ownerEmail,
    status: <StatusBadge value={c.status} />,
    websites: `${c.websites}/${c.usageLimits?.maxWebsites ?? "-"}`,
    seats: c.usageLimits?.maxSeats ?? "-",
    mrr: `$${c.mrr}`,
    updated: c.updated,
    actions: (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={Eye} onClick={() => navigate(`${c.id}`)}>
          Detail
        </Button>
        <CrudActions
          onEdit={() =>
            c.status === "Suspended"
              ? activateCompany(c.id, { notes: "Activated from companies list" })
              : suspendCompany(c.id, { reason: "Manual admin action", notes: "Suspended from companies list" })
          }
          onDelete={() => deleteCompany(c.id)}
          editLabel={c.status === "Suspended" ? "Activate" : "Suspend"}
        />
      </div>
    ),
  }));

  return (
    <AdminPage
      title="Companies"
      description="Workspace CRM snapshot (plans, MRR, limits). For registered platform users and licenses, use Customers & Installations."
      actions={<Button size="sm">Export Companies</Button>}
    >
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input placeholder="Search company or owner email" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Trial">Trial</option>
          <option value="Past Due">Past Due</option>
          <option value="Suspended">Suspended</option>
        </Select>
        <div className="text-sm text-slate-600 self-center">{filtered.length} company(s)</div>
      </div>

      <CrudCreateForm
        title="Create Company"
        fields={[
          { key: "name", label: "Company name" },
          { key: "ownerEmail", label: "Owner email" },
          {
            key: "plan",
            type: "select",
            options: [
              { value: "Starter", label: "Starter" },
              { value: "Growth", label: "Growth" },
              { value: "Enterprise", label: "Enterprise" },
            ],
          },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Trial", label: "Trial" },
              { value: "Active", label: "Active" },
              { value: "Past Due", label: "Past Due" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createCompany(form);
          setForm({ name: "", ownerEmail: "", plan: "Starter", status: "Trial" });
        }}
        submitLabel="Create Company"
      />

      <DataTable
        columns={[
          { key: "name", label: "Company" },
          { key: "plan", label: "Plan" },
          { key: "owner", label: "Owner" },
          { key: "status", label: "Status" },
          { key: "websites", label: "Websites (Used/Limit)" },
          { key: "seats", label: "Seat Limit" },
          { key: "mrr", label: "MRR" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}

