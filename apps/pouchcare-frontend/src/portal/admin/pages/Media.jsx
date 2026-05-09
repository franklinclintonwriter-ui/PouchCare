import { useState, useMemo } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { StatusBadge, CrudActions, CrudCreateForm, MetricTile } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

function parseSizeToKB(size) {
  if (!size || typeof size !== "string") return 0;
  const num = parseFloat(size);
  if (size.includes("MB")) return num * 1024;
  if (size.includes("GB")) return num * 1024 * 1024;
  return num; // KB
}

function formatTotalSize(items) {
  const totalKB = items.reduce((sum, m) => sum + parseSizeToKB(m.size), 0);
  if (totalKB >= 1024) return `${(totalKB / 1024).toFixed(1)} MB`;
  return `${Math.round(totalKB)} KB`;
}

export default function MediaPage() {
  const { data, createMedia, updateMedia, deleteMedia } = useAdminPortal();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ name: "", type: "Image", size: "", alt: "" });

  const mediaList = data.media || [];

  const filtered = useMemo(() => {
    let rows = mediaList;
    if (typeFilter !== "all") rows = rows.filter((m) => m.type === typeFilter);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((m) => m.name.toLowerCase().includes(q) || (m.alt || "").toLowerCase().includes(q));
    }
    return rows;
  }, [mediaList, typeFilter, query]);

  const totalFiles = mediaList.length;
  const totalSize = formatTotalSize(mediaList);
  const imageCount = mediaList.filter((m) => m.type === "Image" || m.type === "SVG").length;

  return (
    <AdminPage
      title="Media Library"
      description="Manage images, assets, and optimization status."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Files" value={totalFiles} hint="All media assets" />
        <MetricTile label="Total Size" value={totalSize} hint="Combined file size" />
        <MetricTile label="Image Count" value={imageCount} hint="Images + SVGs" />
      </div>

      <CrudCreateForm
        title="Upload Media"
        fields={[
          { key: "name", label: "File name" },
          {
            key: "type",
            type: "select",
            options: [
              { value: "Image", label: "Image" },
              { value: "SVG", label: "SVG" },
              { value: "Video", label: "Video" },
              { value: "Document", label: "Document" },
              { value: "Font", label: "Font" },
            ],
          },
          { key: "size", label: "Size (e.g. 245 KB)" },
          { key: "alt", label: "Alt text", full: true },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createMedia({ ...form, status: "Active" });
          setForm({ name: "", type: "Image", size: "", alt: "" });
        }}
        submitLabel="Upload"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search media..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Image">Image</option>
          <option value="SVG">SVG</option>
          <option value="Video">Video</option>
          <option value="Document">Document</option>
          <option value="Font">Font</option>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "File Name" },
          { key: "type", label: "Type" },
          { key: "size", label: "Size" },
          { key: "dimensions", label: "Dimensions" },
          { key: "alt", label: "Alt Text" },
          { key: "usageCount", label: "Usage" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={filtered.map((m) => ({
          name: m.name,
          type: m.type,
          size: m.size,
          dimensions: m.dimensions,
          alt: m.alt || "-",
          usageCount: m.usageCount,
          status: <StatusBadge value={m.status} />,
          updated: m.updated,
          actions: (
            <CrudActions
              onEdit={() => {
                const newAlt = window.prompt("Update alt text:", m.alt || "");
                if (newAlt !== null) updateMedia(m.id, { alt: newAlt });
              }}
              onDelete={() => deleteMedia(m.id)}
              editLabel="Edit Alt"
            />
          ),
        }))}
        emptyMessage="No media files match your filters."
      />
    </AdminPage>
  );
}
