import { useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, CrudActions, StatusBadge } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function SubscriptionsPage() {
  const { data, createSubscription, updateSubscription, deleteSubscription } = useCustomerPortal();
  const [form, setForm] = useState({ name: "", detail: "", status: "Active", renewalDate: "" });

  const rows = data.subscriptions.map((s) => ({
    name: s.name,
    detail: s.detail,
    status: <StatusBadge value={s.status} />,
    updated: s.renewalDate,
    actions: (
      <CrudActions
        onEdit={() => updateSubscription(s.id, { status: s.status === "Active" ? "Paused" : "Active" })}
        onDelete={() => deleteSubscription(s.id)}
        editLabel={s.status === "Active" ? "Pause" : "Resume"}
      />
    ),
  }));

  return (
    <AdminPage title="Subscriptions" description="Plans, quotas, renewal cycles, and add-ons.">
      <CrudCreateForm
        title="Add Subscription"
        fields={[
          { key: "name", label: "Subscription name" },
          { key: "detail", label: "Detail" },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Active", label: "Active" },
              { value: "Paused", label: "Paused" },
            ],
          },
          { key: "renewalDate", label: "Renewal date", type: "date", full: true },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createSubscription(form);
          setForm({ name: "", detail: "", status: "Active", renewalDate: "" });
        }}
        submitLabel="Add Subscription"
      />

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "detail", label: "Detail" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Renewal" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}

