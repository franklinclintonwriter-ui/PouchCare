import { useMemo, useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, CrudActions, CrudCreateForm, MetricTile } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

const STATUS_CYCLE = ["New", "Contacted", "Qualified", "Converted"];

const emptyForm = { name: "", email: "", company: "", source: "Contact Form", priority: "Medium" };

export default function LeadsPage() {
  const { data, createLead, updateLead, deleteLead, convertLead } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.leads.filter((l) => {
      const okStatus = statusFilter === "all" || l.status === statusFilter;
      const okSource = sourceFilter === "all" || l.source === sourceFilter;
      const okQuery = q ? `${l.name} ${l.email} ${l.company}`.toLowerCase().includes(q) : true;
      return okStatus && okSource && okQuery;
    });
  }, [data.leads, query, statusFilter, sourceFilter]);

  const totalLeads = data.leads.length;
  const newLeads = data.leads.filter((l) => l.status === "New").length;
  const convertedLeads = data.leads.filter((l) => l.status === "Converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const cycleStatus = (lead) => {
    const idx = STATUS_CYCLE.indexOf(lead.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateLead(lead.id, { status: next });
  };

  const rows = filtered.map((l) => ({
    name: l.name,
    email: l.email,
    company: l.company,
    source: l.source,
    status: <StatusBadge value={l.status} />,
    priority: l.priority,
    assignedTo: l.assignedTo || "—",
    updated: l.updated,
    actions: (
      <div className="flex flex-wrap items-center gap-2">
        <CrudActions
          onEdit={() => cycleStatus(l)}
          onDelete={() => deleteLead(l.id)}
          editLabel={`→ ${STATUS_CYCLE[(STATUS_CYCLE.indexOf(l.status) + 1) % STATUS_CYCLE.length]}`}
        />
        {l.status !== "Converted" && (
          <Button size="sm" variant="secondary" onClick={() => convertLead(l.id)}>
            Convert
          </Button>
        )}
      </div>
    ),
  }));

  return (
    <AdminPage
      title="Leads"
      description="Form submissions, routing, and lead operations."
      actions={<Button size="sm">Export Leads</Button>}
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Leads" value={totalLeads} hint="All-time lead count" />
        <MetricTile label="New Leads" value={newLeads} hint="Awaiting first contact" />
        <MetricTile label="Conversion Rate" value={`${conversionRate}%`} hint="Converted / Total" />
      </div>

      <CrudCreateForm
        title="Add Lead"
        fields={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email", type: "email" },
          { key: "company", label: "Company" },
          {
            key: "source",
            type: "select",
            options: [
              { value: "Contact Form", label: "Contact Form" },
              { value: "Landing Page", label: "Landing Page" },
              { value: "Referral", label: "Referral" },
              { value: "Demo Request", label: "Demo Request" },
              { value: "Other", label: "Other" },
            ],
          },
          {
            key: "priority",
            type: "select",
            options: [
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createLead({ ...form, status: "New" });
          setForm(emptyForm);
        }}
        submitLabel="Add Lead"
      />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Input placeholder="Search name, email, or company" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
        </Select>
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">All sources</option>
          <option value="Contact Form">Contact Form</option>
          <option value="Landing Page">Landing Page</option>
          <option value="Referral">Referral</option>
          <option value="Demo Request">Demo Request</option>
          <option value="Other">Other</option>
        </Select>
        <div className="text-sm text-slate-600 self-center">{filtered.length} lead(s)</div>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "company", label: "Company" },
          { key: "source", label: "Source" },
          { key: "status", label: "Status" },
          { key: "priority", label: "Priority" },
          { key: "assignedTo", label: "Assigned To" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}
