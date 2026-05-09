import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, CrudActions, CrudCreateForm, MetricTile } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

const CATEGORIES = ["SaaS", "Clinic", "Agency", "Ecommerce", "Education", "Nonprofit"];
const TYPES = ["Page", "Section", "Component"];
const STATUSES = ["Active", "Draft"];

export default function TemplatesPage() {
  const { data, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState({ name: "", slug: "", category: "SaaS", type: "Page", status: "Active" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.templates.filter((t) => {
      const okCategory = categoryFilter === "all" ? true : t.category === categoryFilter;
      const okQuery = q ? `${t.name} ${t.slug}`.toLowerCase().includes(q) : true;
      return okCategory && okQuery;
    });
  }, [data.templates, query, categoryFilter]);

  const activeCount = data.templates.filter((t) => t.status === "Active").length;
  const categoryCount = new Set(data.templates.map((t) => t.category)).size;

  const rows = filtered.map((t) => ({
    name: t.name,
    slug: t.slug,
    category: t.category,
    type: t.type,
    status: <StatusBadge value={t.status} />,
    version: t.version,
    updated: t.updated,
    actions: (
      <div className="flex flex-wrap gap-2">
        <CrudActions
          onEdit={() =>
            updateTemplate(t.id, { status: t.status === "Active" ? "Draft" : "Active" })
          }
          onDelete={() => deleteTemplate(t.id)}
          editLabel={t.status === "Active" ? "Set Draft" : "Activate"}
        />
        <Button size="sm" variant="secondary" icon={Copy} onClick={() => duplicateTemplate(t.id)}>
          Duplicate
        </Button>
      </div>
    ),
  }));

  return (
    <AdminPage
      title="Templates"
      description="Template library, categories, and import readiness."
      actions={<Button size="sm">Export Templates</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Total Templates" value={data.templates.length} hint="All registered templates" />
        <MetricTile label="Active Templates" value={activeCount} hint="Currently active" />
        <MetricTile label="Categories" value={categoryCount} hint="Distinct categories" />
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input placeholder="Search by name or slug" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="text-sm text-slate-600 self-center">{filtered.length} template(s)</div>
      </div>

      <CrudCreateForm
        title="Create Template"
        fields={[
          { key: "name", label: "Template name" },
          { key: "slug", label: "Slug" },
          {
            key: "category",
            type: "select",
            options: CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            key: "type",
            type: "select",
            options: TYPES.map((t) => ({ value: t, label: t })),
          },
          {
            key: "status",
            type: "select",
            options: STATUSES.map((s) => ({ value: s, label: s })),
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createTemplate(form);
          setForm({ name: "", slug: "", category: "SaaS", type: "Page", status: "Active" });
        }}
        submitLabel="Create Template"
      />

      <DataTable
        columns={[
          { key: "name", label: "Template Name" },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Category" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "version", label: "Version" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}
