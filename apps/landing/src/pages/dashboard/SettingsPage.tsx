/**
 * Security & settings — 6 panels:
 * 1. Password change
 * 2. Two-factor authentication (mock)
 * 3. Active sessions (mock)
 * 4. Login history (mock)
 * 5. Notification preferences (mock)
 * 6. Appearance
 *
 * @see docs/TASKS_PROFILE_SECURITY.md
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bell,
  Check,
  Clock,
  Computer,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  LogOut,
  Moon,
  Shield,
  Smartphone,
  Sun,
  SunMoon,
  Tablet,
  Trash2,
  XCircle,
} from "lucide-react";
import { useChangePassword } from "@/api/portal-dashboard";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  MOCK_SESSIONS,
  MOCK_LOGIN_HISTORY,
  loadNotifPrefs,
  saveNotifPrefs,
  loadAppearance,
  saveAppearance,
  type AppearanceMode,
  type MockNotifPrefs,
  type MockSession,
} from "@/data/mockSecurity";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

// ── Password schema ────────────────────────────────────────────────────────
const pwSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Confirm password"),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type PwForm = z.infer<typeof pwSchema>;

// ── Device icon helper ─────────────────────────────────────────────────────
function DeviceIcon({ device }: { device: MockSession["device"] }) {
  const cls = "h-4 w-4 shrink-0 text-gray-400";
  if (device === "Mobile") return <Smartphone className={cls} />;
  if (device === "Tablet") return <Tablet className={cls} />;
  return <Laptop className={cls} />;
}

// ── Toggle row ─────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-start justify-between gap-4 py-3"
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
    >
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-primary-600" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  // 1. Password
  const changePw = useChangePassword();
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const onSubmitPw = async (v: PwForm) => {
    try {
      await changePw.mutateAsync({
        current_password: v.current_password,
        new_password: v.new_password,
      });
      toast.success("Password updated");
      pwForm.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    }
  };

  // 2. 2FA (mock)
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const BACKUP_CODES = ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6", "Q7R8-S9T0"];

  // 3. Sessions (mock)
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const revokeSession = (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    toast.success("Session revoked (mock)");
  };
  const revokeAll = () => {
    setSessions((s) => s.filter((x) => x.isCurrent));
    toast.success("All other sessions revoked (mock)");
  };

  // 5. Notifications (mock)
  const [notifPrefs, setNotifPrefs] = useState<MockNotifPrefs>(loadNotifPrefs);
  const updateNotif = (key: keyof MockNotifPrefs, value: boolean) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    saveNotifPrefs(next);
    toast.success("Preference saved");
  };

  // 6. Appearance (mock)
  const [appearance, setAppearance] = useState<AppearanceMode>(loadAppearance);
  const setMode = (mode: AppearanceMode) => {
    setAppearance(mode);
    saveAppearance(mode);
    toast.success(`Theme set to ${mode}`);
  };

  const APPEARANCE_OPTIONS: { value: AppearanceMode; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: SunMoon },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Security & Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your password, two-factor auth, active sessions, and preferences.
        </p>
      </div>

      {/* ── 1. Password ─────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Password"
        description="Change the password you use to sign in."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <KeyRound className="h-4 w-4" />
          </div>
        }
      >
        <form
          onSubmit={pwForm.handleSubmit(onSubmitPw)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl"
        >
          {(
            [
              { id: "current_password", label: "Current password", auto: "current-password" },
              { id: "new_password", label: "New password", auto: "new-password" },
              { id: "confirm", label: "Confirm new password", auto: "new-password" },
            ] as const
          ).map(({ id, label, auto }) => (
            <div key={id} className={id === "current_password" ? "sm:col-span-2" : ""}>
              <Label htmlFor={id}>{label}</Label>
              <div className="relative mt-1">
                <Input
                  id={id}
                  type={showPw[id] ? "text" : "password"}
                  autoComplete={auto}
                  className="min-h-[44px] pr-10"
                  {...pwForm.register(id)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, [id]: !p[id] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw[id] ? "Hide password" : "Show password"}
                >
                  {showPw[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwForm.formState.errors[id] && (
                <p className="mt-1 text-xs text-red-600">
                  {pwForm.formState.errors[id]?.message}
                </p>
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={changePw.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {changePw.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      {/* ── 2. Two-factor auth ───────────────────────────────────────────── */}
      <DashboardPanel
        title="Two-factor authentication"
        description="Add an extra layer of security to your account (mock — no backend yet)."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Shield className="h-4 w-4" />
          </div>
        }
      >
        <div className="space-y-4">
          <ToggleRow
            label="Enable authenticator app"
            description="Scan the QR code with Google Authenticator or Authy."
            checked={twoFaEnabled}
            onChange={(v) => {
              setTwoFaEnabled(v);
              if (v) toast.success("2FA enabled (mock)");
              else { toast.success("2FA disabled (mock)"); setShowBackupCodes(false); }
            }}
          />
          {twoFaEnabled && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Mock QR code placeholder */}
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-white text-xs text-gray-400">
                  QR code
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">Scan with your authenticator app</p>
                  <p className="text-gray-500">
                    Manual key:{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
                      JBSWY3DPEHPK3PXP
                    </code>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[40px]"
                    onClick={() => setShowBackupCodes((v) => !v)}
                  >
                    {showBackupCodes ? "Hide" : "Show"} backup codes
                  </Button>
                  {showBackupCodes && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3 md:grid-cols-5">
                      {BACKUP_CODES.map((c) => (
                        <code
                          key={c}
                          className="rounded bg-gray-100 px-2 py-1 text-center font-mono text-xs text-gray-800"
                        >
                          {c}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardPanel>

      {/* ── 3. Active sessions ───────────────────────────────────────────── */}
      <DashboardPanel
        title="Active sessions"
        description="Devices currently signed in to your account."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[40px]"
            icon={<LogOut className="h-3.5 w-3.5" />}
            onClick={revokeAll}
            disabled={sessions.filter((s) => !s.isCurrent).length === 0}
          >
            Sign out all others
          </Button>
        }
      >
        <ul className="divide-y divide-gray-100">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <DeviceIcon device={s.device} />
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                    {s.browser} on {s.os}
                    {s.isCurrent && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Check className="h-2.5 w-2.5" />
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {s.location} · {s.ip}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {s.isCurrent ? "Active now" : `Last seen ${formatDateShort(s.lastSeen)}`}
                  </p>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] shrink-0 text-red-600 hover:border-red-200 hover:bg-red-50"
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => revokeSession(s.id)}
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </DashboardPanel>

      {/* ── 4. Login history ────────────────────────────────────────────── */}
      <DashboardPanel
        title="Login history"
        description="Recent sign-in activity on your account."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        }
      >
        <div className="hidden overflow-x-auto rounded-lg border border-gray-100 md:block">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                {["Date", "Device", "Location", "IP", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_LOGIN_HISTORY.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 tabular-nums text-gray-600">
                    {formatDateShort(e.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {e.browser} / {e.device}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.location}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.ip}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        e.status === "success"
                          ? "success"
                          : e.status === "failed"
                            ? "error"
                            : "warning"
                      }
                    >
                      {e.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {MOCK_LOGIN_HISTORY.map((e) => (
            <li key={e.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {e.browser} on {e.device}
                </p>
                <Badge
                  variant={
                    e.status === "success"
                      ? "success"
                      : e.status === "failed"
                        ? "error"
                        : "warning"
                  }
                >
                  {e.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {e.location} · {e.ip}
              </p>
              <p className="mt-1 text-xs text-gray-400">{formatDateShort(e.timestamp)}</p>
            </li>
          ))}
        </ul>
      </DashboardPanel>

      {/* ── 5. Notification preferences ─────────────────────────────────── */}
      <DashboardPanel
        title="Notifications"
        description="Choose when and how PouchCare contacts you."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Bell className="h-4 w-4" />
          </div>
        }
      >
        <div className="divide-y divide-gray-100">
          <ToggleRow
            label="Order updates"
            description="Status changes, delivery confirmations, and revision requests."
            checked={notifPrefs.orderUpdates}
            onChange={(v) => updateNotif("orderUpdates", v)}
          />
          <ToggleRow
            label="Billing & wallet alerts"
            description="Deposits confirmed, low balance warnings, payout results."
            checked={notifPrefs.billingAlerts}
            onChange={(v) => updateNotif("billingAlerts", v)}
          />
          <ToggleRow
            label="System alerts"
            description="Maintenance windows, security events, and policy updates."
            checked={notifPrefs.systemAlerts}
            onChange={(v) => updateNotif("systemAlerts", v)}
          />
          <ToggleRow
            label="New features & product news"
            description="Hear about new services, improvements, and announcements."
            checked={notifPrefs.newFeatures}
            onChange={(v) => updateNotif("newFeatures", v)}
          />
          <ToggleRow
            label="Marketing emails"
            description="Promotions, seasonal offers, and partner deals."
            checked={notifPrefs.marketingEmails}
            onChange={(v) => updateNotif("marketingEmails", v)}
          />
          <ToggleRow
            label="SMS alerts"
            description="Critical account alerts via text message."
            checked={notifPrefs.smsAlerts}
            onChange={(v) => updateNotif("smsAlerts", v)}
          />
        </div>
      </DashboardPanel>

      {/* ── 6. Appearance ───────────────────────────────────────────────── */}
      <DashboardPanel
        title="Appearance"
        description="Portal theme preference (stored locally — no backend sync)."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Computer className="h-4 w-4" />
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
          {APPEARANCE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all",
                appearance === value
                  ? "border-primary-400 bg-primary-50 text-primary-700 ring-2 ring-primary-400/30"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
              aria-pressed={appearance === value}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Dark mode visual changes require additional CSS variable support — coming soon.
        </p>
      </DashboardPanel>

      {/* ── Danger zone ─────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Danger zone"
        description="Irreversible account actions."
      >
        <Button
          type="button"
          variant="danger"
          className="min-h-[44px] w-full sm:w-auto"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => toast.error("Account deletion requires contacting support — this is a safety guard.")}
        >
          Delete account
        </Button>
      </DashboardPanel>
    </div>
  );
}
