import { useMemo, useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, CrudActions, StatusBadge } from "../../shared/components";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function BillingPage() {
  const { data, createPaymentMethod, deletePaymentMethod } = useCustomerPortal();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ label: "", type: "Card", status: "Active" });

  const filteredMethods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.billing.paymentMethods.filter((pm) => {
      const okStatus = statusFilter === "all" ? true : pm.status === statusFilter;
      const okQuery = q ? `${pm.label} ${pm.type}`.toLowerCase().includes(q) : true;
      return okStatus && okQuery;
    });
  }, [data.billing.paymentMethods, query, statusFilter]);

  const paymentRows = filteredMethods.map((pm) => ({
    name: pm.label,
    detail: pm.type,
    status: <StatusBadge value={pm.status} />,
    updated: pm.updated,
    actions: <CrudActions onDelete={() => deletePaymentMethod(pm.id)} deleteLabel="Remove" />,
  }));

  const invoiceRows = data.billing.invoices.map((inv) => ({
    name: inv.id,
    detail: inv.amount,
    status: <StatusBadge value={inv.status} />,
    updated: inv.date,
  }));

  return (
    <AdminPage title="Billing" description="Invoices, payment methods, and transaction history.">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input placeholder="Search payment methods" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
        <div className="text-sm text-slate-600 self-center">{filteredMethods.length} method(s)</div>
      </div>

      <CrudCreateForm
        title="Add Payment Method"
        fields={[
          { key: "label", label: "Method label" },
          {
            key: "type",
            type: "select",
            options: [
              { value: "Card", label: "Card" },
              { value: "Bank", label: "Bank" },
              { value: "Wallet", label: "Wallet" },
            ],
          },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ],
          },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createPaymentMethod(form);
          setForm({ label: "", type: "Card", status: "Active" });
        }}
        submitLabel="Add Method"
      />

      <DataTable
        columns={[
          { key: "name", label: "Payment Method" },
          { key: "detail", label: "Type" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={paymentRows}
        emptyMessage="No payment methods configured."
      />

      <DataTable
        columns={[
          { key: "name", label: "Invoice" },
          { key: "detail", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Date" },
        ]}
        rows={invoiceRows}
      />
    </AdminPage>
  );
}

