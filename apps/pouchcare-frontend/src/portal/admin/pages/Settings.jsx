import { useState } from "react";
import AdminPage from "../../../components/ui/PageShell";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { MetricTile, OpsPanel } from "../../shared/components";
import { useAdminPortal } from "../state/AdminPortalContext";

export default function SettingsPage() {
  const { data, updatePlatformSettings, retryWebhook } = useAdminPortal();
  const s = data.platformSettings;
  const logs = data.webhookLogs || [];

  const [editingSettings, setEditingSettings] = useState(false);

  /* ── Local form state for each section ─────────── */
  const [general, setGeneral] = useState({
    brandName: s.brandName,
    supportEmail: s.supportEmail,
    defaultTemplate: s.defaultTemplate,
    customDomain: s.customDomain,
    maintenanceMode: s.maintenanceMode,
  });

  const [security, setSecurity] = useState({
    privacyPolicyUrl: s.privacyPolicyUrl,
    termsUrl: s.termsUrl,
    maxUploadSizeMb: s.maxUploadSizeMb,
    allowedFileTypes: s.allowedFileTypes,
  });

  const [integrations, setIntegrations] = useState({
    webhookUrl: s.webhookUrl,
    webhookSecret: s.webhookSecret,
    emailNotifications: s.emailNotifications,
    slackIntegration: s.slackIntegration,
    analyticsEnabled: s.analyticsEnabled,
  });

  /* ── Metrics ───────────────────────────────────── */
  const enabledIntegrations = [s.emailNotifications, s.slackIntegration, s.analyticsEnabled].filter(Boolean).length;
  const failedHooks = logs.filter((l) => l.httpCode >= 400);
  const webhookStatus = failedHooks.length > 0 ? "Degraded" : "Healthy";

  const toggleEdit = () => setEditingSettings((prev) => !prev);

  return (
    <AdminPage
      title="Settings"
      description="Global platform settings, policies, and integrations."
      actions={
        <Button size="sm" onClick={toggleEdit}>
          {editingSettings ? "Lock Settings" : "Edit Settings"}
        </Button>
      }
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Integrations" value={enabledIntegrations} hint="Enabled integrations" />
        <MetricTile label="Webhook Status" value={webhookStatus} hint={failedHooks.length > 0 ? `${failedHooks.length} failing` : "All deliveries OK"} />
        <MetricTile label="Upload Limit" value={`${s.maxUploadSizeMb} MB`} hint={`Allowed: ${s.allowedFileTypes}`} />
      </div>

      {/* ── General Settings ──────────────────────── */}
      <OpsPanel title="General Settings" subtitle="Brand identity, default template, and maintenance controls." className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Brand Name
            <Input
              className="mt-1"
              value={general.brandName}
              disabled={!editingSettings}
              onChange={(e) => setGeneral((p) => ({ ...p, brandName: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Support Email
            <Input
              className="mt-1"
              type="email"
              value={general.supportEmail}
              disabled={!editingSettings}
              onChange={(e) => setGeneral((p) => ({ ...p, supportEmail: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Default Template
            <Input
              className="mt-1"
              value={general.defaultTemplate}
              disabled={!editingSettings}
              onChange={(e) => setGeneral((p) => ({ ...p, defaultTemplate: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Custom Domain
            <Input
              className="mt-1"
              value={general.customDomain}
              disabled={!editingSettings}
              onChange={(e) => setGeneral((p) => ({ ...p, customDomain: e.target.value }))}
            />
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button
              size="sm"
              variant={general.maintenanceMode ? "primary" : "secondary"}
              disabled={!editingSettings}
              onClick={() => setGeneral((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
            >
              Maintenance Mode: {general.maintenanceMode ? "ON" : "OFF"}
            </Button>
          </div>
          {editingSettings && (
            <div className="sm:col-span-2">
              <Button size="sm" onClick={() => updatePlatformSettings(general)}>
                Save General
              </Button>
            </div>
          )}
        </div>
      </OpsPanel>

      {/* ── Security & Compliance ─────────────────── */}
      <OpsPanel title="Security & Compliance" subtitle="Legal URLs, upload limits, and file restrictions." className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Privacy Policy URL
            <Input
              className="mt-1"
              value={security.privacyPolicyUrl}
              disabled={!editingSettings}
              onChange={(e) => setSecurity((p) => ({ ...p, privacyPolicyUrl: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Terms URL
            <Input
              className="mt-1"
              value={security.termsUrl}
              disabled={!editingSettings}
              onChange={(e) => setSecurity((p) => ({ ...p, termsUrl: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Max Upload Size (MB)
            <Input
              className="mt-1"
              type="number"
              value={security.maxUploadSizeMb}
              disabled={!editingSettings}
              onChange={(e) => setSecurity((p) => ({ ...p, maxUploadSizeMb: Number(e.target.value) }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Allowed File Types
            <Input
              className="mt-1"
              value={security.allowedFileTypes}
              disabled={!editingSettings}
              onChange={(e) => setSecurity((p) => ({ ...p, allowedFileTypes: e.target.value }))}
            />
          </label>
          {editingSettings && (
            <div className="sm:col-span-2">
              <Button size="sm" onClick={() => updatePlatformSettings(security)}>
                Save Security
              </Button>
            </div>
          )}
        </div>
      </OpsPanel>

      {/* ── Integrations ─────────────────────────── */}
      <OpsPanel title="Integrations" subtitle="Webhook endpoint, notification channels, and analytics." className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Webhook URL
            <Input
              className="mt-1"
              value={integrations.webhookUrl}
              disabled={!editingSettings}
              onChange={(e) => setIntegrations((p) => ({ ...p, webhookUrl: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Webhook Secret
            <Input
              className="mt-1"
              value={integrations.webhookSecret}
              disabled={!editingSettings}
              onChange={(e) => setIntegrations((p) => ({ ...p, webhookSecret: e.target.value }))}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button
              size="sm"
              variant={integrations.emailNotifications ? "primary" : "secondary"}
              disabled={!editingSettings}
              onClick={() => setIntegrations((p) => ({ ...p, emailNotifications: !p.emailNotifications }))}
            >
              Email Notifications: {integrations.emailNotifications ? "ON" : "OFF"}
            </Button>
            <Button
              size="sm"
              variant={integrations.slackIntegration ? "primary" : "secondary"}
              disabled={!editingSettings}
              onClick={() => setIntegrations((p) => ({ ...p, slackIntegration: !p.slackIntegration }))}
            >
              Slack: {integrations.slackIntegration ? "ON" : "OFF"}
            </Button>
            <Button
              size="sm"
              variant={integrations.analyticsEnabled ? "primary" : "secondary"}
              disabled={!editingSettings}
              onClick={() => setIntegrations((p) => ({ ...p, analyticsEnabled: !p.analyticsEnabled }))}
            >
              Analytics: {integrations.analyticsEnabled ? "ON" : "OFF"}
            </Button>
          </div>
          {editingSettings && (
            <div className="sm:col-span-2">
              <Button size="sm" onClick={() => updatePlatformSettings(integrations)}>
                Save Integrations
              </Button>
            </div>
          )}
        </div>
      </OpsPanel>

      {/* ── Webhook Delivery Logs ─────────────────── */}
      <OpsPanel title="Webhook Delivery Logs" subtitle="Inbound and outbound webhook delivery outcomes.">
        <DataTable
          columns={[
            { key: "event", label: "Event" },
            { key: "endpoint", label: "Endpoint" },
            { key: "httpCode", label: "HTTP Code" },
            { key: "retries", label: "Retries" },
            { key: "updated", label: "Updated" },
            { key: "actions", label: "Actions" },
          ]}
          rows={logs.map((log) => ({
            event: log.event,
            endpoint: log.endpoint,
            httpCode: log.httpCode,
            retries: log.retryCount,
            updated: log.updated,
            actions:
              log.httpCode >= 400 ? (
                <Button size="sm" variant="secondary" onClick={() => retryWebhook(log.id)}>
                  Retry
                </Button>
              ) : (
                "Delivered"
              ),
          }))}
        />
      </OpsPanel>
    </AdminPage>
  );
}
