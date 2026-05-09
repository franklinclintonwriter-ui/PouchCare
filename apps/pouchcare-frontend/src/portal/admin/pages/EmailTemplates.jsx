import { useState, useMemo, useCallback } from "react";
import AdminPage from "../../../components/ui/PageShell";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { MetricTile, OpsPanel } from "../../shared/components";
import { useAdminAuth } from "../auth/AdminAuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
import {
  Mail, KeyRound, FileText, RefreshCw, Package,
  MessageSquare, AlertTriangle, Building2, Eye, EyeOff,
  Send, RotateCcw, Save,
} from "lucide-react";

/** @type {{ key: string, label: string, icon: import("lucide-react").LucideIcon }[]} */
const TEMPLATE_TYPES = [
  { key: "welcome", label: "Welcome", icon: Mail },
  { key: "password_reset", label: "Password Reset", icon: KeyRound },
  { key: "invoice", label: "Invoice", icon: FileText },
  { key: "subscription_renewal", label: "Subscription Renewal", icon: RefreshCw },
  { key: "plugin_update", label: "Plugin Update", icon: Package },
  { key: "ticket_response", label: "Ticket Response", icon: MessageSquare },
  { key: "payment_failure", label: "Payment Failure", icon: AlertTriangle },
  { key: "new_company", label: "New Company", icon: Building2 },
];

const DEFAULT_TEMPLATES = {
  welcome: {
    subject: "Welcome to {{brand_name}}!",
    body: "<h2>Welcome, {{user_name}}!</h2><p>Thank you for joining {{brand_name}}.</p>",
    variables: ["brand_name", "user_name", "login_url", "support_email"],
    customized: false,
  },
  password_reset: {
    subject: "Reset Your Password - {{brand_name}}",
    body: '<h2>Password Reset</h2><p>Hi {{user_name}}, click the link below to reset your password.</p><p><a href="{{reset_url}}">Reset Password</a></p>',
    variables: ["brand_name", "user_name", "reset_url", "expiry_hours"],
    customized: false,
  },
  invoice: {
    subject: "Invoice #{{invoice_number}} from {{brand_name}}",
    body: "<h2>Invoice #{{invoice_number}}</h2><p>Hi {{user_name}}, your invoice for {{amount}} is due {{due_date}}.</p>",
    variables: ["brand_name", "user_name", "invoice_number", "amount", "due_date", "invoice_url"],
    customized: false,
  },
  subscription_renewal: {
    subject: "Your {{plan_name}} Subscription Has Been Renewed",
    body: "<h2>Subscription Renewed</h2><p>Hi {{user_name}}, your {{plan_name}} has been renewed for {{amount}}.</p>",
    variables: ["brand_name", "user_name", "plan_name", "amount", "next_renewal_date", "manage_url"],
    customized: false,
  },
  plugin_update: {
    subject: "Plugin Update Available: {{plugin_name}} v{{new_version}}",
    body: "<h2>Plugin Update</h2><p>Hi {{user_name}}, {{plugin_name}} {{old_version}} can be updated to {{new_version}}.</p>",
    variables: ["brand_name", "user_name", "plugin_name", "old_version", "new_version", "changelog_url"],
    customized: false,
  },
  ticket_response: {
    subject: "Re: {{ticket_subject}} - Ticket #{{ticket_id}}",
    body: "<h2>Ticket #{{ticket_id}}</h2><p>Hi {{user_name}}, there is a new response on: {{ticket_subject}}</p><blockquote>{{response_body}}</blockquote>",
    variables: ["brand_name", "user_name", "ticket_id", "ticket_subject", "response_body", "ticket_url"],
    customized: false,
  },
  payment_failure: {
    subject: "Payment Failed - Action Required",
    body: "<h2>Payment Failed</h2><p>Hi {{user_name}}, we could not process your payment of {{amount}}. Reason: {{reason}}.</p>",
    variables: ["brand_name", "user_name", "amount", "reason", "retry_url", "support_email"],
    customized: false,
  },
  new_company: {
    subject: "New Company Registered: {{company_name}}",
    body: "<h2>New Company</h2><p>{{company_name}} has been registered by {{owner_name}} ({{owner_email}}).</p>",
    variables: ["brand_name", "company_name", "owner_name", "owner_email", "admin_url"],
    customized: false,
  },
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selected, setSelected] = useState("welcome");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastSent, setLastSent] = useState(/** @type {string|null} */ (null));
  const { token } = useAdminAuth();

  const current = templates[selected] || DEFAULT_TEMPLATES[selected];

  const updateField = useCallback(
    (field, value) => {
      setTemplates((prev) => ({
        ...prev,
        [selected]: { ...prev[selected], [field]: value, customized: true },
      }));
    },
    [selected],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const tmpl = templates[selected];
      const res = await fetch(`${API_BASE}/admin/email-templates/${selected}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: tmpl.subject, body: tmpl.body }),
      });
      if (!res.ok) throw new Error("Save failed");
      setTemplates((prev) => ({
        ...prev,
        [selected]: { ...prev[selected], customized: true },
      }));
    } catch {
      setTemplates((prev) => ({
        ...prev,
        [selected]: { ...prev[selected], customized: true },
      }));
    } finally {
      setSaving(false);
    }
  }, [selected, templates, token]);

  const handleReset = useCallback(() => {
    const def = DEFAULT_TEMPLATES[selected];
    if (!def) return;
    setTemplates((prev) => ({
      ...prev,
      [selected]: { ...def, customized: false },
    }));
  }, [selected]);

  const handleSendTest = useCallback(async () => {
    setTesting(true);
    try {
      await fetch(`${API_BASE}/admin/email-templates/${selected}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setLastSent(new Date().toLocaleString());
    } catch {
      setLastSent(new Date().toLocaleString() + " (local)");
    } finally {
      setTesting(false);
    }
  }, [selected, token]);

  const totalTemplates = TEMPLATE_TYPES.length;
  const customizedCount = useMemo(
    () => Object.values(templates).filter((t) => t.customized).length,
    [templates],
  );

  const previewHtml = useMemo(() => {
    let html = current.body || "";
    (current.variables || []).forEach((v) => {
      html = html.replaceAll(
        `{{${v}}}`,
        `<span style="background:#dbeafe;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:13px;">${v}</span>`,
      );
    });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:16px;color:#333;}</style></head><body>${html}</body></html>`;
  }, [current.body, current.variables]);

  return (
    <AdminPage
      title="Email Templates"
      description="Manage and customize email notification templates."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MetricTile label="Total Templates" value={totalTemplates} hint="Registered email types" />
        <MetricTile label="Customized" value={customizedCount} hint="Templates with overrides" />
        <MetricTile label="Last Sent" value={lastSent || "Never"} hint="Most recent email delivery" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <OpsPanel title="Templates" subtitle="Select a template to edit.">
            <nav className="flex flex-col gap-1">
              {TEMPLATE_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setSelected(key); setShowPreview(false); }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selected === key
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </OpsPanel>
        </aside>

        <div className="flex-1">
          <OpsPanel
            title={TEMPLATE_TYPES.find((t) => t.key === selected)?.label ?? selected}
            subtitle={current.customized ? "Custom override active" : "Using default template"}
          >
            <label className="mb-4 block text-xs font-medium text-slate-600">
              Subject Line
              <Input
                className="mt-1"
                value={current.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />
            </label>

            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                {showPreview ? "Preview" : "Body (HTML)"}
              </span>
              <Button size="sm" variant="secondary" onClick={() => setShowPreview((p) => !p)}>
                {showPreview ? <><EyeOff size={14} className="mr-1" /> Edit</> : <><Eye size={14} className="mr-1" /> Preview</>}
              </Button>
            </div>

            {showPreview ? (
              <div className="mb-4 overflow-hidden rounded-md border border-slate-200">
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="h-80 w-full border-0"
                />
              </div>
            ) : (
              <textarea
                className="mb-4 w-full rounded-md border border-slate-200 p-3 font-mono text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                rows={12}
                value={current.body}
                onChange={(e) => updateField("body", e.target.value)}
              />
            )}

            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-slate-500">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {(current.variables || []).map((v) => (
                  <code key={v} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {"{{" + v + "}}"}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save size={14} className="mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleReset}>
                <RotateCcw size={14} className="mr-1" />
                Reset to Default
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSendTest} disabled={testing}>
                <Send size={14} className="mr-1" />
                {testing ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </OpsPanel>
        </div>
      </div>
    </AdminPage>
  );
}
