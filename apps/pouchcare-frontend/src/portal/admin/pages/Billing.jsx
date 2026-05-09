import { useState } from "react";
import Button from "../../../components/ui/Button";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import { CrudCreateForm, CrudActions, StatusBadge, MetricTile, OpsPanel } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

export default function BillingPage() {
  const { data, createBillingRecord, updateBillingRecord, deleteBillingRecord } = useAdminPortal();
  const [form, setForm] = useState({ company: "", amount: "", status: "Pending", dueDate: "" });
  const [gatewaySnapshot] = useState([
    { invoiceId: "inv_3001", gatewayAmount: 1499, gatewayStatus: "Settled" },
    { invoiceId: "inv_3002", gatewayAmount: 349, gatewayStatus: "Declined" },
    { invoiceId: "inv_3003", gatewayAmount: 89, gatewayStatus: "Pending" },
  ]);

  const totalDue = data.billingRecords.reduce((sum, r) => (r.status !== "Paid" ? sum + Number(r.amount || 0) : sum), 0);
  const failedPayments = data.billingRecords.filter((r) => r.status === "Overdue" || r.status === "Pending");
  const mismatches = data.billingRecords
    .map((record) => {
      const gateway = gatewaySnapshot.find((entry) => entry.invoiceId === record.id);
      if (!gateway) return null;
      if (gateway.gatewayAmount !== Number(record.amount || 0)) {
        return { ...record, gatewayAmount: gateway.gatewayAmount, gatewayStatus: gateway.gatewayStatus, reason: "Amount mismatch" };
      }
      if (gateway.gatewayStatus === "Declined" && record.status !== "Overdue") {
        return { ...record, gatewayAmount: gateway.gatewayAmount, gatewayStatus: gateway.gatewayStatus, reason: "Gateway declined but not overdue" };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <AdminPage
      title="Billing"
      description="Company-wide invoices, payment status, and collection controls."
      actions={<Button size="sm">Run Reconciliation</Button>}
    >
      <CrudCreateForm
        title="Create Billing Record"
        fields={[
          { key: "company", label: "Company" },
          { key: "amount", label: "Amount (USD)", type: "number" },
          {
            key: "status",
            type: "select",
            options: [
              { value: "Pending", label: "Pending" },
              { value: "Paid", label: "Paid" },
              { value: "Overdue", label: "Overdue" },
            ],
          },
          { key: "dueDate", label: "Due date", type: "date" },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createBillingRecord({ ...form, amount: Number(form.amount || 0) });
          setForm({ company: "", amount: "", status: "Pending", dueDate: "" });
        }}
        submitLabel="Create Record"
      />

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Open Balance" value={`$${totalDue}`} hint="All non-paid invoices" />
        <MetricTile label="Failed/At-Risk" value={failedPayments.length} hint="Pending + overdue invoices" />
        <MetricTile label="Reconciliation Flags" value={mismatches.length} hint="Needs manual verification" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <OpsPanel
          title="Billing Reconciliation"
          subtitle="Compare internal records with gateway snapshots."
          actions={<Button size="sm">Run Reconciliation</Button>}
        >
          <DataTable
            columns={[
              { key: "invoice", label: "Invoice" },
              { key: "company", label: "Company" },
              { key: "internal", label: "Internal" },
              { key: "gateway", label: "Gateway" },
              { key: "reason", label: "Mismatch" },
            ]}
            rows={mismatches.map((item) => ({
              invoice: item.id,
              company: item.company,
              internal: `$${item.amount}`,
              gateway: `$${item.gatewayAmount} (${item.gatewayStatus})`,
              reason: item.reason,
            }))}
            emptyMessage="No reconciliation mismatches."
          />
        </OpsPanel>

        <OpsPanel title="Failed Payments Queue" subtitle="Retry processing or move to overdue hold.">
          <DataTable
            columns={[
              { key: "invoice", label: "Invoice" },
              { key: "company", label: "Company" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={failedPayments.map((item) => ({
              invoice: item.id,
              company: item.company,
              amount: `$${item.amount}`,
              status: <StatusBadge value={item.status} />,
              actions: (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateBillingRecord(item.id, { status: "Paid" })}>
                    Retry Charge
                  </Button>
                  <Button size="sm" onClick={() => updateBillingRecord(item.id, { status: "Overdue" })}>
                    Move to Overdue
                  </Button>
                </div>
              ),
            }))}
            emptyMessage="No failed payments in queue."
          />
        </OpsPanel>
      </div>

      <DataTable
        columns={[
          { key: "id", label: "Invoice" },
          { key: "company", label: "Company" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "dueDate", label: "Due Date" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={data.billingRecords.map((r) => ({
          id: r.id,
          company: r.company,
          amount: `$${r.amount}`,
          status: <StatusBadge value={r.status} />,
          dueDate: r.dueDate,
          updated: r.updated,
          actions: (
            <CrudActions
              onEdit={() => updateBillingRecord(r.id, { status: r.status === "Paid" ? "Pending" : "Paid" })}
              onDelete={() => deleteBillingRecord(r.id)}
              editLabel={r.status === "Paid" ? "Mark Pending" : "Mark Paid"}
            />
          ),
        }))}
      />
    </AdminPage>
  );
}

