import { useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, CrudActions, StatusBadge } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function SupportPage() {
  const { data, createTicket, updateTicket, deleteTicket } = useCustomerPortal();
  const [form, setForm] = useState({ subject: "", priority: "Medium", status: "Open", note: "" });

  const rows = data.tickets.map((t) => ({
    name: t.id,
    detail: t.subject,
    status: <StatusBadge value={t.status} />,
    updated: t.updated,
    actions: (
      <CrudActions
        onEdit={() => updateTicket(t.id, { status: t.status === "Open" ? "Resolved" : "Open" })}
        onDelete={() => deleteTicket(t.id)}
        editLabel={t.status === "Open" ? "Resolve" : "Reopen"}
      />
    ),
  }));

  return (
    <AdminPage title="Support" description="Tickets, SLAs, and support communication history.">
      <CrudCreateForm
        title="Create Support Ticket"
        fields={[
          { key: "subject", label: "Subject", full: true },
          {
            key: "priority",
            type: "select",
            options: [
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
            ],
          },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Open", label: "Open" },
              { value: "Resolved", label: "Resolved" },
            ],
          },
          { key: "note", label: "Issue details", type: "textarea", full: true, required: false },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createTicket(form);
          setForm({ subject: "", priority: "Medium", status: "Open", note: "" });
        }}
        submitLabel="Submit Ticket"
      />

      <DataTable
        columns={[
          { key: "name", label: "Ticket" },
          { key: "detail", label: "Subject" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />
    </AdminPage>
  );
}

