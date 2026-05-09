import { useState, useMemo } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, MetricTile, OpsPanel } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

export default function SeoPage() {
  const { data, updateSeoEntry } = useAdminPortal();
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState({ metaTitle: "", metaDescription: "", ogImage: "", schemaType: "WebSite" });

  const entries = data.seoEntries || [];
  const pagesTracked = entries.length;
  const avgScore = pagesTracked ? Math.round(entries.reduce((s, e) => s + (e.score || 0), 0) / pagesTracked) : 0;
  const needsAttention = entries.filter((e) => e.score < 60).length;

  const selectedEntry = useMemo(() => entries.find((e) => e.id === selectedId), [entries, selectedId]);

  function handleEdit(entry) {
    setSelectedId(entry.id);
    setEditForm({
      metaTitle: entry.metaTitle || "",
      metaDescription: entry.metaDescription || "",
      ogImage: entry.ogImage || "",
      schemaType: entry.schemaType || "WebSite",
    });
  }

  function handleSave() {
    if (!selectedId) return;
    const score = computeScore(editForm);
    const status = score >= 80 ? "Optimized" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Missing";
    updateSeoEntry(selectedId, { ...editForm, score, status });
    setSelectedId(null);
  }

  function computeScore(form) {
    let score = 0;
    if (form.metaTitle) score += 35;
    if (form.metaDescription) score += 35;
    if (form.ogImage) score += 15;
    if (form.schemaType) score += 15;
    return score;
  }

  return (
    <AdminPage
      title="SEO"
      description="Meta settings, indexing controls, and technical checks."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Pages Tracked" value={pagesTracked} hint="Pages with SEO entries" />
        <MetricTile label="Average Score" value={avgScore} hint="Across all tracked pages" />
        <MetricTile label="Needs Attention" value={needsAttention} hint="Score below 60" />
      </div>

      <OpsPanel title="SEO Overview" subtitle="Review and edit meta data for all tracked pages.">
        <DataTable
          columns={[
            { key: "page", label: "Page" },
            { key: "slug", label: "Slug" },
            { key: "score", label: "Score" },
            { key: "status", label: "Status" },
            { key: "schemaType", label: "Schema Type" },
            { key: "updated", label: "Updated" },
            { key: "actions", label: "Actions" },
          ]}
          rows={entries.map((e) => ({
            page: e.pageTitle,
            slug: e.slug,
            score: (
              <span
                className={`font-semibold ${
                  e.score >= 80
                    ? "text-emerald-600"
                    : e.score >= 60
                      ? "text-sky-600"
                      : e.score >= 40
                        ? "text-amber-600"
                        : "text-rose-600"
                }`}
              >
                {e.score}
              </span>
            ),
            status: <StatusBadge value={e.status} />,
            schemaType: e.schemaType,
            updated: e.updated,
            actions: (
              <Button size="sm" variant="secondary" onClick={() => handleEdit(e)}>
                Edit
              </Button>
            ),
          }))}
          emptyMessage="No SEO entries found."
        />
      </OpsPanel>

      {selectedId && selectedEntry && (
        <OpsPanel
          title={`Edit SEO — ${selectedEntry.pageTitle}`}
          subtitle={`Slug: ${selectedEntry.slug}`}
          className="mt-6"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Meta Title</label>
              <Input
                placeholder="Meta title"
                value={editForm.metaTitle}
                onChange={(e) => setEditForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Meta Description</label>
              <textarea
                placeholder="Meta description"
                value={editForm.metaDescription}
                onChange={(e) => setEditForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                rows={3}
                className="w-full rounded-btn border border-gray-200 bg-white px-4 py-2.5 text-sm text-heading placeholder:text-body/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">OG Image</label>
              <Input
                placeholder="OG image filename"
                value={editForm.ogImage}
                onChange={(e) => setEditForm((prev) => ({ ...prev, ogImage: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Schema Type</label>
              <Select
                value={editForm.schemaType}
                onChange={(e) => setEditForm((prev) => ({ ...prev, schemaType: e.target.value }))}
              >
                <option value="WebSite">WebSite</option>
                <option value="Product">Product</option>
                <option value="ContactPage">ContactPage</option>
                <option value="Blog">Blog</option>
                <option value="AboutPage">AboutPage</option>
                <option value="Organization">Organization</option>
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </OpsPanel>
      )}
    </AdminPage>
  );
}
