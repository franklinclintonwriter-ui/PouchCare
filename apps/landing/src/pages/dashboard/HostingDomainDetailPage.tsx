/**
 * Single domain: usage, DNS, nameservers, certificate, editable settings.
 * Scoped to logged-in portal member — distinct from staff asset domain detail in management.
 * @see HOSTING_PORTAL.md — card fallbacks for DNS on narrow viewports.
 */
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Globe2,
  HardDrive,
  Lock,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { paths } from "@/routes/paths";
import {
  usePortalDomain,
  useUpdateDomain,
  useDeleteDomain,
  useAddDnsRecord,
  useUpdateDnsRecord,
  useDeleteDnsRecord,
  type DnsRecord,
} from "@/api/portal-hosting";
import { formatDateShort, formatUsd } from "@/lib/format";
import { hostingStatusVariant } from "@/lib/hostingUtils";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { UsageMeterBar } from "@/components/hosting/UsageMeterBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT"] as const;

export default function HostingDomainDetailPage() {
  const navigate = useNavigate();
  const { domainId } = useParams<{ domainId: string }>();
  const { data: d, isLoading } = usePortalDomain(domainId);

  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [nameserversText, setNameserversText] = useState("");

  const [newType, setNewType] = useState<string>("A");
  const [newName, setNewName] = useState("@");
  const [newValue, setNewValue] = useState("");
  const [newTtl, setNewTtl] = useState("3600");

  const [editing, setEditing] = useState<DnsRecord | null>(null);
  const [deleteDnsConfirmId, setDeleteDnsConfirmId] = useState<string | null>(
    null,
  );
  const [deleteDomainConfirmOpen, setDeleteDomainConfirmOpen] = useState(false);

  const updateDomainMutation = useUpdateDomain();
  const deleteDomainMutation = useDeleteDomain();
  const addDnsMutation = useAddDnsRecord(domainId || "");
  const updateDnsMutation = useUpdateDnsRecord(domainId || "");
  const deleteDnsMutation = useDeleteDnsRecord(domainId || "");

  useEffect(() => {
    if (!d) return;
    setAutoRenew(d.autoRenew);
    setNotes(d.notes ?? "");
    setNameserversText(d.nameservers.join("\n"));
  }, [d]);

  if (!domainId) {
    return <Navigate to={paths.dashboardHosting} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!d) {
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

  const saveSettings = async () => {
    try {
      await updateDomainMutation.mutateAsync({
        id: d.id,
        autoRenew,
        notes: notes.trim() || undefined,
      });
      toast.success("Domain settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const saveNameservers = async () => {
    const lines = nameserversText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length < 1) {
      toast.error("Enter at least one nameserver");
      return;
    }
    try {
      await updateDomainMutation.mutateAsync({
        id: d.id,
        nameservers: lines,
      });
      toast.success("Nameservers updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleAddDns = async () => {
    if (!newValue.trim()) {
      toast.error("Value is required");
      return;
    }
    const ttl = Number.parseInt(newTtl, 10);
    if (!Number.isFinite(ttl) || ttl < 60) {
      toast.error("TTL must be at least 60");
      return;
    }
    try {
      await addDnsMutation.mutateAsync({
        type: newType,
        name: newName.trim() || "@",
        value: newValue.trim(),
        ttl,
      });
      setNewValue("");
      toast.success("DNS record added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add record");
    }
  };

  const handleSaveEditDns = async () => {
    if (!editing) return;
    const ttl = Number.parseInt(String(editing.ttl), 10);
    if (!Number.isFinite(ttl) || ttl < 60) {
      toast.error("TTL must be at least 60");
      return;
    }
    try {
      await updateDnsMutation.mutateAsync({
        recordId: editing.id,
        type: editing.type,
        name: editing.name.trim(),
        value: editing.value.trim(),
        ttl,
      });
      setEditing(null);
      toast.success("DNS record updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDeleteDns = async (recordId: string) => {
    try {
      await deleteDnsMutation.mutateAsync(recordId);
      toast.success("DNS record deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleDeleteDomain = async () => {
    try {
      await deleteDomainMutation.mutateAsync(d.id);
      toast.success("Domain removed");
      navigate(paths.dashboardHosting, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm"
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
        <span className="break-all font-mono text-gray-900 dark:text-gray-100">
          {d.fqdn}
        </span>
      </nav>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4 text-white shadow-lg sm:p-6 md:p-8",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Globe2
                className="h-6 w-6 shrink-0 text-primary-300"
                aria-hidden
              />
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
                <Calendar
                  className="h-3.5 w-3.5 text-primary-300"
                  aria-hidden
                />
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
              onClick={() => toast.message("Renewal invoice sent to email")}
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
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Monthly
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {formatUsd(d.monthlyPriceUsd)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bandwidth
          </p>
          <UsageMeterBar
            used={d.bandwidthGb.used}
            limit={d.bandwidthGb.limit}
          />
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Storage
          </p>
          <UsageMeterBar used={d.storageGb.used} limit={d.storageGb.limit} />
        </div>
      </div>

      <DashboardPanel
        title="Domain settings"
        description="Update auto-renewal and notes."
        action={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 sm:text-sm">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editable
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
                      : "min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 sm:min-h-0"
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
                      : "min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 sm:min-h-0"
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
            disabled={updateDomainMutation.isPending}
          >
            {updateDomainMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <DashboardPanel
          title="DNS records"
          description="Add, edit, and delete DNS records for your domain."
        >
          <div className="mb-4 rounded-xl border border-dashed border-primary-200 bg-primary-50/30 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Add record
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dns-type">Type</Label>
                <select
                  id="dns-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm"
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
            {d.dnsRecords.map((r) => {
              const isEditingThis = editing?.id === r.id;
              const otherBeingEdited = !!editing && !isEditingThis;
              return (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isEditingThis
                      ? "border-primary-400 bg-primary-50/60 dark:border-primary-500 dark:bg-primary-900/20 ring-2 ring-primary-500/20"
                      : "border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/50",
                    otherBeingEdited && "opacity-40 pointer-events-none",
                  )}
                >
                  {isEditingThis ? (
                    <>
                      <div
                        role="status"
                        aria-live="polite"
                        className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
                      >
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        Editing DNS record
                      </div>
                      <DnsEditForm
                        record={editing}
                        onChange={setEditing}
                        onSave={handleSaveEditDns}
                        onCancel={() => setEditing(null)}
                        saving={updateDomainMutation.isPending}
                      />
                    </>
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
                            disabled={otherBeingEdited}
                            className="min-h-[44px] rounded-lg px-2 text-sm font-medium text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDnsConfirmId(r.id)}
                            disabled={otherBeingEdited}
                            className="min-h-[44px] rounded-lg px-2 text-sm text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white"
                            aria-label="Copy record"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            Name
                          </dt>
                          <dd className="break-all font-mono text-gray-900 dark:text-gray-100">
                            {r.name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            Value
                          </dt>
                          <dd className="break-all font-mono text-gray-700 dark:text-gray-300">
                            {r.value}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400">
                            TTL
                          </dt>
                          <dd className="tabular-nums text-gray-700 dark:text-gray-300">
                            {r.ttl}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Value</th>
                  <th className="px-3 py-2 font-semibold">TTL</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {d.dnsRecords.map((r) => {
                  const isEditingThis = editing?.id === r.id;
                  const otherBeingEdited = !!editing && !isEditingThis;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "transition-colors",
                        !editing &&
                          "hover:bg-gray-50/60 dark:hover:bg-gray-800",
                        otherBeingEdited && "opacity-40",
                      )}
                    >
                      {isEditingThis ? (
                        <td
                          colSpan={5}
                          className="bg-primary-50/70 dark:bg-primary-900/20 p-3 ring-2 ring-inset ring-primary-400/50"
                        >
                          <div
                            role="status"
                            aria-live="polite"
                            className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
                          >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            Editing DNS record
                          </div>
                          <DnsEditForm
                            record={editing}
                            onChange={setEditing}
                            onSave={handleSaveEditDns}
                            onCancel={() => setEditing(null)}
                            layout="row"
                            saving={updateDomainMutation.isPending}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-primary-700">
                            {r.type}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                            {r.name}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400 lg:max-w-none">
                            {r.value}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-gray-500 dark:text-gray-400">
                            {r.ttl}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditing({ ...r })}
                                disabled={otherBeingEdited}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteDnsConfirmId(r.id)}
                                disabled={otherBeingEdited}
                                className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Copy row"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title="Nameservers"
            description="One per line — use custom nameservers if needed."
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
              placeholder={"ns1.example.com\nns2.example.com"}
              aria-label="Nameservers, one per line"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3 min-h-[44px] w-full sm:w-auto"
              onClick={saveNameservers}
              disabled={updateDomainMutation.isPending}
            >
              {updateDomainMutation.isPending ? "Saving…" : "Save nameservers"}
            </Button>
          </DashboardPanel>

          <DashboardPanel
            title="Certificate"
            description="TLS certificate information."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px]"
                onClick={() =>
                  toast.success("Mock: certificate renewal queued")
                }
              >
                Renew SSL
              </Button>
            }
          >
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Shield className="h-4 w-4 shrink-0" aria-hidden />
                  Issuer
                </dt>
                <dd className="break-words text-right font-medium text-gray-900 dark:text-gray-100 sm:text-left">
                  {d.sslIssuer}
                </dd>
              </div>
              <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Radio className="h-4 w-4 shrink-0" aria-hidden />
                  Registered
                </dt>
                <dd className="tabular-nums text-gray-800 dark:text-gray-200">
                  {formatDateShort(d.registeredAt)}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <HardDrive className="h-4 w-4 shrink-0" aria-hidden />
                  Plan
                </dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {d.planName}
                </dd>
              </div>
            </dl>
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel
        title="Danger zone"
        description="Permanently remove this domain from your portfolio."
      >
        <Button
          type="button"
          variant="danger"
          className="min-h-[48px] w-full touch-manipulation sm:w-auto"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => setDeleteDomainConfirmOpen(true)}
        >
          Remove domain
        </Button>
      </DashboardPanel>

      <ConfirmDialog
        open={deleteDnsConfirmId != null}
        onCancel={() => setDeleteDnsConfirmId(null)}
        onConfirm={() => {
          if (!deleteDnsConfirmId) return;
          return handleDeleteDns(deleteDnsConfirmId).finally(() => {
            setDeleteDnsConfirmId(null);
          });
        }}
        title="Remove this DNS record?"
        description="This change can affect your website and email delivery."
        confirmLabel="Remove record"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteDnsMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDomainConfirmOpen}
        onCancel={() => setDeleteDomainConfirmOpen(false)}
        onConfirm={() => handleDeleteDomain()}
        title={`Remove ${d.fqdn}?`}
        description="This removes the domain from your portfolio. DNS and settings will no longer be managed here."
        confirmLabel="Remove domain"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteDomainMutation.isPending}
      />
    </div>
  );
}

function DnsEditForm({
  record,
  onChange,
  onSave,
  onCancel,
  layout = "stack",
  saving = false,
}: {
  record: DnsRecord;
  onChange: (r: DnsRecord) => void;
  onSave: () => void;
  onCancel: () => void;
  layout?: "stack" | "row";
  saving?: boolean;
}) {
  const ttl = Number(record.ttl);
  const ttlError =
    !Number.isFinite(ttl) || !Number.isInteger(ttl) || ttl < 60
      ? "TTL must be an integer ≥ 60 seconds."
      : "";

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
            className="mt-0.5 w-full min-h-[40px] rounded border border-gray-300 dark:border-gray-600 px-2 text-xs"
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
              onChange({
                ...record,
                ttl: e.target.value === "" ? Number.NaN : Number(e.target.value),
              })
            }
            className="mt-0.5 min-h-[40px] text-xs"
          />
          {ttlError ? (
            <p className="mt-1 text-xs font-medium text-red-600">{ttlError}</p>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={onSave}
          disabled={saving || !!ttlError}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
