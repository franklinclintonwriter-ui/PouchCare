import { useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, CrudActions, StatusBadge } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function PluginsPage() {
  const { data, createPlugin, updatePlugin, deletePlugin } = useCustomerPortal();
  const [form, setForm] = useState({ name: "", version: "", status: "Installed" });

  const rows = data.plugins.map((p) => ({
    name: p.name,
    detail: p.version,
    status: <StatusBadge value={p.status} />,
    updated: p.updated,
    actions: (
      <CrudActions
        onEdit={() => updatePlugin(p.id, { status: p.status === "Installed" ? "Disabled" : "Installed" })}
        onDelete={() => deletePlugin(p.id)}
        editLabel={p.status === "Installed" ? "Disable" : "Enable"}
      />
    ),
  }));

  return (
    <AdminPage title="Plugins" description="Installed plugins, updates, and compatibility checks.">
      <CrudCreateForm
        title="Add Plugin"
        fields={[
          { key: "name", label: "Plugin name" },
          { key: "version", label: "Version" },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Installed", label: "Installed" },
              { value: "Disabled", label: "Disabled" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createPlugin(form);
          setForm({ name: "", version: "", status: "Installed" });
        }}
        submitLabel="Install Plugin"
      />

      <DataTable
        columns={[
          { key: "name", label: "Plugin" },
          { key: "detail", label: "Version" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}

