/**
 * Single domain: usage, DNS, nameservers, certificate, editable settings (mock store).
 * @see HOSTING_PORTAL.md — card fallbacks for DNS on narrow viewports.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Globe2,
  HardDrive,
  Lock,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { paths } from "@/routes/paths";
import type { DnsRecord } from "@/data/mockHosting";
import {
  addDnsRecord,
  deleteHostingDomain,
  removeDnsRecord,
  updateDnsRecord,
  updateHostingDomain,
} from "@/data/mockHostingStore";
import { formatDateShort, formatUsd } from "@/lib/format";
import { hostingStatusVariant } from "@/lib/hostingUtils";
import { useMockHostingDomains } from "@/hooks/useMockHostingDomains";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { UsageMeterBar } from "@/components/hosting/UsageMeterBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT"] as const;

export default function HostingDomainDetailPage() {
  const navigate = useNavigate();
  const { domainId } = useParams<{ domainId: string }>();
  const domains = useMockHostingDomains();
  const d = useMemo(
    () => (domainId ? domains.find((x) => x.id === domainId) : undefined),
    [domains, domainId],
  );

  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [nameserversText, setNameserversText] = useState("");

  const [newType, setNewType] = useState<string>("A");
  const [newName, setNewName] = useState("@");
  const [newValue, setNewValue] = useState("");
  const [newTtl, setNewTtl] = useState("3600");

  const [editing, setEditing] = useState<DnsRecord | null>(null);

  useEffect(() => {
    if (!d) return;
    setAutoRenew(d.autoRenew);
    setNotes(d.notes ?? "");
    setNameserversText(d.nameservers.join("\n"));
  }, [d]);

  if (!domainId || !d) {
    return <Navigate to={paths.dashboardHosting} replace />;
  }

  const copyNs = () => {
    void navigator.clipboard.writeText(d.nameservers.join("\n"));
    toast.success("Nameservers copied");
  };

  const copyRecord = (line: string) => {
    void navigator.clipboard.writeText(line);
    toast.success("Copied");
  };

  const saveSettings = () => {
    updateHostingDomain(d.id, {
      autoRenew,
      notes: notes.trim() || undefined,
    });
    toast.success("Settings saved");
  };

  const saveNameservers = () => {
    const lines = nameserversText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length < 1) {
      toast.error("Enter at least one nameserver");
      return;
    }
    updateHostingDomain(d.id, { nameservers: lines });
    toast.success("Nameservers updated");
  };

  const handleAddDns = () => {
    if (!newValue.trim()) {
      toast.error("Value is required");
      return;
    }
    const ttl = Number.parseInt(newTtl, 10);
    if (!Number.isFinite(ttl) || ttl < 60) {
      toast.error("TTL must be at least 60");
      return;
    }
    addDnsRecord(d.id, {
      type: newType,
      name: newName.trim() || "@",
      value: newValue.trim(),
      ttl,
    });
    setNewValue("");
    toast.success("DNS record added");
  };

  const handleSaveEditDns = () => {
    if (!editing) return;
    const ttl = Number.parseInt(String(editing.ttl), 10);
    if (!Number.isFinite(ttl) || ttl < 60) {
      toast.error("TTL must be at least 60");
      return;
    }
    updateDnsRecord(d.id, editing.id, {
      type: editing.type,
      name: editing.name.trim(),
      value: editing.value.trim(),
      ttl,
    });
    setEditing(null);
    toast.success("Record updated");
  };

  const handleDeleteDns = (recordId: string) => {
    if (!window.confirm("Remove this DNS record?")) return;
    removeDnsRecord(d.id, recordId);
    toast.success("Record removed");
  };

  const handleDeleteDomain = () => {
    if (
      !window.confirm(
        `Remove ${d.fqdn} from your portfolio? This is a mock action only.`,
      )
    ) {
      return;
    }
    if (deleteHostingDomain(d.id)) {
      toast.success("Domain removed from mock portfolio");
      navigate(paths.dashboardHosting, { replace: true });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm"
        aria-label="Breadcrumb"
      >
        <Link
          to={paths.dashboardHosting}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-primary-600 hover:text-primary-800 sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          My domains
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span className="break-all font-mono text-gray-900">{d.fqdn}</span>
      </nav>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4 text-white shadow-lg sm:p-6 md:p-8",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Globe2 className="h-6 w-6 shrink-0 text-primary-300" aria-hidden />
              <h1 className="break-all font-mono text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                {d.fqdn}
              </h1>
              <Badge variant={hostingStatusVariant(d.status)}>
                {d.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {d.planName} · {d.registrar} · Uptime target{" "}
              <span className="font-semibold text-white">{d.uptimePct}%</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium backdrop-blur-sm sm:py-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary-300" aria-hidden />
                Renews {formatDateShort(d.expiresAt)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium backdrop-blur-sm sm:py-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                SSL {formatDateShort(d.sslExpiresAt)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium backdrop-blur-sm sm:py-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Auto-renew {d.autoRenew ? "on" : "off"}
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:w-auto lg:flex-col">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:min-h-0 sm:w-auto"
              onClick={() => toast.message("Mock: renewal invoice sent to email")}
            >
              Renew now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] w-full text-white hover:bg-white/10 sm:min-h-0 sm:w-auto"
              as="a"
              href={`mailto:support@pouchcare.com?subject=DNS%20${encodeURIComponent(d.fqdn)}`}
            >
              DNS support
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Monthly
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatUsd(d.monthlyPriceUsd)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Bandwidth
          </p>
          <UsageMeterBar
            used={d.bandwidthGb.used}
            limit={d.bandwidthGb.limit}
          />
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Storage
          </p>
          <UsageMeterBar
            used={d.storageGb.used}
            limit={d.storageGb.limit}
          />
        </div>
      </div>

      <DashboardPanel
        title="Domain settings"
        description="Saved to the mock portfolio (sessionStorage)."
        action={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 sm:text-sm">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Draft
          </span>
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <Label>Auto-renew registration</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRenew(true)}
                  className={
                    autoRenew
                      ? "min-h-[44px] rounded-xl border border-primary-500 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-950 transition-colors sm:min-h-0"
                      : "min-h-[44px] rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 sm:min-h-0"
                  }
                >
                  On
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRenew(false)}
                  className={
                    !autoRenew
                      ? "min-h-[44px] rounded-xl border border-primary-500 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-950 transition-colors sm:min-h-0"
                      : "min-h-[44px] rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 sm:min-h-0"
                  }
                >
                  Off
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="domain-notes">Notes</Label>
              <Textarea
                id="domain-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[120px] text-base sm:text-sm"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            className="min-h-[48px] w-full shrink-0 lg:w-auto lg:min-w-[140px]"
            icon={<Save className="h-4 w-4" />}
            onClick={saveSettings}
          >
            Save changes
          </Button>
        </div>
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardPanel
          title="DNS records"
          description="Mock CRUD — changes persist for this browser session."
        >
          <div className="mb-4 rounded-xl border border-dashed border-primary-200 bg-primary-50/30 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Add record</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dns-type">Type</Label>
                <select
                  id="dns-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {DNS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="dns-name">Name</Label>
                <Input
                  id="dns-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 min-h-[44px]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="dns-value">Value</Label>
                <Input
                  id="dns-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="mt-1 min-h-[44px]"
                  placeholder="IP or hostname"
                />
              </div>
              <div>
                <Label htmlFor="dns-ttl">TTL (sec)</Label>
                <Input
                  id="dns-ttl"
                  type="number"
                  min={60}
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3 min-h-[44px] w-full sm:w-auto"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAddDns}
            >
              Add record
            </Button>
          </div>

          <ul className="space-y-3 md:hidden">
            {d.dnsRecords.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
              >
                {editing?.id === r.id ? (
                  <DnsEditForm
                    record={editing}
                    onChange={setEditing}
                    onSave={handleSaveEditDns}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-primary-100 px-2 py-0.5 font-mono text-xs font-bold text-primary-800">
                        {r.type}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...r })}
                          className="min-h-[44px] rounded-lg px-2 text-sm font-medium text-primary-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDns(r.id)}
                          className="min-h-[44px] rounded-lg px-2 text-sm text-red-600"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyRecord(`${r.type}\t${r.name}\t${r.value}\t${r.ttl}`)
                          }
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:bg-white"
                          aria-label="Copy record"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">Name</dt>
                        <dd className="break-all font-mono text-gray-900">{r.name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Value</dt>
                        <dd className="break-all font-mono text-gray-700">{r.value}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">TTL</dt>
                        <dd className="tabular-nums text-gray-700">{r.ttl}</dd>
                      </div>
                    </dl>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-gray-100 md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Value</th>
                  <th className="px-3 py-2 font-semibold">TTL</th>
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.dnsRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    {editing?.id === r.id ? (
                      <td colSpan={5} className="bg-primary-50/40 p-3">
                        <DnsEditForm
                          record={editing}
                          onChange={setEditing}
                          onSave={handleSaveEditDns}
                          onCancel={() => setEditing(null)}
                          layout="row"
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-primary-700">
                          {r.type}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-800">
                          {r.name}
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs text-gray-600 lg:max-w-none">
                          {r.value}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-gray-500">
                          {r.ttl}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditing({ ...r })}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDns(r.id)}
                              className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyRecord(
                                  `${r.type}\t${r.name}\t${r.value}\t${r.ttl}`,
                                )
                              }
                              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                              aria-label="Copy row"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title="Nameservers"
            description="One per line — saved to the mock store."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px] w-full sm:w-auto"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={copyNs}
              >
                Copy all
              </Button>
            }
          >
            <Textarea
              value={nameserversText}
              onChange={(e) => setNameserversText(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              placeholder="ns1.example.com&#10;ns2.example.com"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3 min-h-[44px] w-full sm:w-auto"
              onClick={saveNameservers}
            >
              Save nameservers
            </Button>
          </DashboardPanel>

          <DashboardPanel
            title="Certificate"
            description="TLS metadata (mock)."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px]"
                onClick={() => toast.success("Mock: certificate renewal queued")}
              >
                Renew SSL
              </Button>
            }
          >
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Shield className="h-4 w-4 shrink-0" aria-hidden />
                  Issuer
                </dt>
                <dd className="break-words text-right font-medium text-gray-900 sm:text-left">
                  {d.sslIssuer}
                </dd>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Radio className="h-4 w-4 shrink-0" aria-hidden />
                  Registered
                </dt>
                <dd className="tabular-nums text-gray-800">
                  {formatDateShort(d.registeredAt)}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <HardDrive className="h-4 w-4 shrink-0" aria-hidden />
                  Plan
                </dt>
                <dd className="font-medium text-gray-900">{d.planName}</dd>
              </div>
            </dl>
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel
        title="Danger zone"
        description="Remove this domain from your mock portfolio."
      >
        <Button
          type="button"
          variant="danger"
          className="min-h-[48px] w-full touch-manipulation sm:w-auto"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={handleDeleteDomain}
        >
          Remove domain
        </Button>
      </DashboardPanel>
    </div>
  );
}

function DnsEditForm({
  record,
  onChange,
  onSave,
  onCancel,
  layout = "stack",
}: {
  record: DnsRecord;
  onChange: (r: DnsRecord) => void;
  onSave: () => void;
  onCancel: () => void;
  layout?: "stack" | "row";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        layout === "row" && "sm:flex-row sm:flex-wrap sm:items-end",
      )}
    >
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Type</Label>
          <select
            value={record.type}
            onChange={(e) => onChange({ ...record, type: e.target.value })}
            className="mt-0.5 w-full min-h-[40px] rounded border border-gray-300 px-2 text-xs"
          >
            {DNS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={record.name}
            onChange={(e) => onChange({ ...record, name: e.target.value })}
            className="mt-0.5 min-h-[40px] text-xs"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs">Value</Label>
          <Input
            value={record.value}
            onChange={(e) => onChange({ ...record, value: e.target.value })}
            className="mt-0.5 min-h-[40px] text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">TTL</Label>
          <Input
            type="number"
            min={60}
            value={record.ttl}
            onChange={(e) =>
              onChange({ ...record, ttl: Number(e.target.value) })
            }
            className="mt-0.5 min-h-[40px] text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="primary" onClick={onSave}>
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
