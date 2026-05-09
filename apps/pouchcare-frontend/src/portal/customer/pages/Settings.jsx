import { useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { CrudCreateForm, CrudActions, OpsPanel } from "../../shared/components";
import { useCustomerPortal } from "../state/CustomerPortalContext";

export default function SettingsPage() {
  const { data, updateSettings, createApiKey, deleteApiKey } = useCustomerPortal();
  const [form, setForm] = useState({ name: "", keyPreview: "", status: "Active" });

  const rows = data.settings.apiKeys.map((k) => ({
    name: k.name,
    detail: k.keyPreview,
    status: k.status,
    updated: k.updated,
    actions: <CrudActions onDelete={() => deleteApiKey(k.id)} deleteLabel="Revoke" />,
  }));

  return (
    <AdminPage title="Settings" description="Security, notifications, API keys, and preferences.">
      <Card hover={false} className="p-5">
        <h3 className="text-base font-semibold text-slate-900">Security & Notifications</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={data.settings.twoFactorEnabled ? "primary" : "secondary"}
            onClick={() => updateSettings({ twoFactorEnabled: !data.settings.twoFactorEnabled })}
          >
            {data.settings.twoFactorEnabled ? "2FA Enabled" : "Enable 2FA"}
          </Button>
          <Button
            size="sm"
            variant={data.settings.emailAlertsEnabled ? "primary" : "secondary"}
            onClick={() => updateSettings({ emailAlertsEnabled: !data.settings.emailAlertsEnabled })}
          >
            {data.settings.emailAlertsEnabled ? "Email Alerts On" : "Email Alerts Off"}
          </Button>
          <Button
            size="sm"
            variant={data.settings.weeklyDigestEnabled ? "primary" : "secondary"}
            onClick={() => updateSettings({ weeklyDigestEnabled: !data.settings.weeklyDigestEnabled })}
          >
            {data.settings.weeklyDigestEnabled ? "Weekly Digest On" : "Weekly Digest Off"}
          </Button>
        </div>
      </Card>

      <CrudCreateForm
        title="Create API Key"
        fields={[
          { key: "name", label: "Key name" },
          { key: "keyPreview", label: "Preview" },
          { key: "status", label: "Status" },
        ]}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={(e) => {
          e.preventDefault();
          createApiKey(form);
          setForm({ name: "", keyPreview: "", status: "Active" });
        }}
        submitLabel="Create Key"
      />

      <DataTable
        columns={[
          { key: "name", label: "API Key" },
          { key: "detail", label: "Preview" },
          { key: "status", label: "Status" },
          { key: "updated", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={rows}
      />

      <OpsPanel
        title="Notification Preferences"
        subtitle="Choose which email notifications you want to receive."
        className="mt-6"
      >
        <div className="flex flex-col gap-3">
          {[
            {
              key: "emailOnRenewal",
              label: "Subscription Renewal",
              description: "Receive an email when your subscription is renewed.",
            },
            {
              key: "emailOnPluginUpdate",
              label: "Plugin Updates",
              description: "Get notified when updates are available for your plugins.",
            },
            {
              key: "emailOnTicketResponse",
              label: "Ticket Responses",
              description: "Receive an email when a support ticket gets a response.",
            },
            {
              key: "emailMarketing",
              label: "Marketing Emails",
              description: "Receive product announcements, tips, and promotional offers.",
            },
          ].map(({ key, label, description }) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 transition-colors hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={!!data.settings[key]}
                onChange={() => updateSettings({ [key]: !data.settings[key] })}
              />
              <div>
                <span className="text-sm font-medium text-slate-900">{label}</span>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </OpsPanel>
    </AdminPage>
  );
}
