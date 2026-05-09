import { useMemo, useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { CrudCreateForm, CrudActions, StatusBadge } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function WebsitesPage() {
  const { data, createWebsite, updateWebsite, deleteWebsite } = useCustomerPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ name: "", domain: "", status: "Draft" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.websites.filter((w) => {
      const okStatus = statusFilter === "all" ? true : w.status === statusFilter;
      const okQuery = q === "" ? true : `${w.name} ${w.domain}`.toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [data.websites, query, statusFilter]);

  const rows = filtered.map((w) => ({
    name: w.name,
    domain: w.domain,
    status: <StatusBadge value={w.status} />,
    updated: w.updated,
    actions: (
      <CrudActions
        onEdit={() => updateWebsite(w.id, { status: w.status === "Published" ? "Draft" : "Published" })}
        onDelete={() => deleteWebsite(w.id)}
        editLabel={w.status === "Published" ? "Unpublish" : "Publish"}
      />
    ),
  }));

  return (
    <AdminPage title="Websites" description="Create, publish, and manage customer websites.">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input placeholder="Search websites or domains" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Staging">Staging</option>
        </Select>
        <div className="text-sm text-slate-600 self-center">{filtered.length} result(s)</div>
      </div>

      <CrudCreateForm
        title="Add Website"
        fields={[
          { key: "name", label: "Website name" },
          { key: "domain", label: "Domain" },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Draft", label: "Draft" },
              { value: "Published", label: "Published" },
              { value: "Staging", label: "Staging" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createWebsite(form);
          setForm({ name: "", domain: "", status: "Draft" });
        }}
        submitLabel="Create Website"
      />

      <DataTable
        columns={[
          { key: "name", label: "Website" },
          { key: "domain", label: "Domain" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}

