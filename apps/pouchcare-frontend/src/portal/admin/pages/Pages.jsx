import { useState, useMemo } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, CrudActions, CrudCreateForm, MetricTile } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

export default function PagesPage() {
  const { data, createPage, updatePage, deletePage } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ title: "", slug: "", template: "None", status: "Draft" });

  const templateOptions = useMemo(() => {
    const names = (data.templates || []).map((t) => t.name);
    return ["None", ...names];
  }, [data.templates]);

  const filtered = useMemo(() => {
    let rows = data.pages || [];
    if (statusFilter !== "all") rows = rows.filter((p) => p.status === statusFilter);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return rows;
  }, [data.pages, statusFilter, query]);

  const totalPages = (data.pages || []).length;
  const publishedCount = (data.pages || []).filter((p) => p.status === "Published").length;
  const avgSeo = totalPages ? Math.round((data.pages || []).reduce((s, p) => s + (p.seoScore || 0), 0) / totalPages) : 0;

  return (
    <AdminPage
      title="Pages"
      description="Page-level content, revisions, and publishing states."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Pages" value={totalPages} hint="All pages in system" />
        <MetricTile label="Published" value={publishedCount} hint="Currently live pages" />
        <MetricTile label="Average SEO Score" value={avgSeo} hint="Across all pages" />
      </div>

      <CrudCreateForm
        title="Create Page"
        fields={[
          { key: "title", label: "Page Title" },
          { key: "slug", label: "Slug (e.g. /about)" },
          {
            key: "template",
            type: "select",
            options: templateOptions.map((n) => ({ value: n, label: n })),
          },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Published", label: "Published" },
              { value: "Draft", label: "Draft" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createPage(form);
          setForm({ title: "", slug: "", template: "None", status: "Draft" });
        }}
        submitLabel="Create Page"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "title", label: "Page Title" },
          { key: "slug", label: "Slug" },
          { key: "template", label: "Template" },
          { key: "status", label: "Status" },
          { key: "seoScore", label: "SEO Score" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={filtered.map((p) => ({
          title: p.title,
          slug: p.slug,
          template: p.template,
          status: <StatusBadge value={p.status} />,
          seoScore: (
            <span
              className={
                p.seoScore >= 80
                  ? "font-semibold text-emerald-600"
                  : p.seoScore >= 50
                    ? "font-semibold text-amber-600"
                    : "font-semibold text-rose-600"
              }
            >
              {p.seoScore}
            </span>
          ),
          updated: p.updated,
          actions: (
            <CrudActions
              onEdit={() =>
                updatePage(p.id, { status: p.status === "Published" ? "Draft" : "Published" })
              }
              onDelete={() => deletePage(p.id)}
              editLabel={p.status === "Published" ? "Unpublish" : "Publish"}
            />
          ),
        }))}
        emptyMessage="No pages match your filters."
      />
    </AdminPage>
  );
}
