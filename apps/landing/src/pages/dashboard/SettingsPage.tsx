/**
 * Security & settings — 7 panels:
 * 1. Password change (with strength indicator)
 * 2. Two-factor authentication (coming soon)
 * 3. Active sessions (API-based)
 * 4. Login history (API-based)
 * 5. Notification preferences (API-based)
 * 6. Appearance (theme mode + accent color picker)
 * 7. Danger zone (with confirmation dialog)
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bell,
  Check,
  Clock,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Laptop,
  LogOut,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  SunMoon,
  Tablet,
  Trash2,
  XCircle,
} from "lucide-react";
import { useChangePassword } from "@/api/portal-dashboard";
import {
  useSessions,
  useRevokeSession,
  useRevokeAllSessions,
  useLoginHistory,
  useSecuritySettings,
  useUpdateSecuritySettings,
} from "@/api/portal-security";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { HelpText } from "@/components/ui/HelpText";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import {
  useThemeStore,
  ACCENT_OPTIONS,
  type ThemeMode,
} from "@/stores/themeStore";
import { usePortalAuthStore } from "@/stores/portalAuthStore";

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

function DeviceIcon({ device }: { device: string }) {
  const cls = "h-4 w-4 shrink-0 text-gray-400";
  if (device === "Mobile") return <Smartphone className={cls} />;
  if (device === "Tablet") return <Tablet className={cls} />;
  return <Laptop className={cls} />;
}

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
        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700",
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

// PasswordStrength now lives in `@/components/ui/PasswordStrength` and is
// shared with RegisterPage + ResetPasswordPage. The local implementation was
// removed in the Week-2 migration.

const MODE_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    desc: "Clean, bright interface",
  },
  { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  {
    value: "system",
    label: "System",
    icon: SunMoon,
    desc: "Match your device",
  },
];

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const changePw = useChangePassword();
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });
  const watchNewPw = pwForm.watch("new_password") ?? "";

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

  const sessions = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession.mutateAsync(id);
      toast.success("Session revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke session");
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAll.mutateAsync();
      toast.success("All other sessions revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke sessions");
    }
  };

  const loginHistory = useLoginHistory(1, 20);

  const securitySettings = useSecuritySettings();
  const updateSettings = useUpdateSecuritySettings();

  const handleNotifUpdate = async (key: string, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success("Preference saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const themeMode = useThemeStore((s) => s.mode);
  const themeAccent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  const userEmail = usePortalAuthStore((s) => s.user?.email ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Security & Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your password, two-factor auth, active sessions, and
          preferences.
        </p>
      </div>

      {/* 1. Password */}
      <DashboardPanel
        title="Password"
        description="Change the password you use to sign in."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
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
              {
                id: "current_password",
                label: "Current password",
                auto: "current-password",
              },
              {
                id: "new_password",
                label: "New password",
                auto: "new-password",
              },
              {
                id: "confirm",
                label: "Confirm new password",
                auto: "new-password",
              },
            ] as const
          ).map(({ id, label, auto }) => (
            <div
              key={id}
              className={id === "current_password" ? "sm:col-span-2" : ""}
            >
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
                  {showPw[id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {id === "new_password" && (
                <>
                  {watchNewPw.length === 0 && (
                    <HelpText className="mt-2">
                      Use at least 8 characters with a mix of letters, numbers
                      and a symbol.
                    </HelpText>
                  )}
                  {watchNewPw.length > 0 && (
                    <PasswordStrength className="mt-2" value={watchNewPw} />
                  )}
                </>
              )}
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

      {/* 2. Two-factor authentication — Coming soon */}
      <DashboardPanel
        title="Two-factor authentication"
        description="Add an extra layer of security to your account."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="info">Coming soon</Badge>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
        }
      >
        <div className="rounded-xl border border-primary-200/60 bg-primary-50/50 p-5 dark:border-primary-800/40 dark:bg-primary-950/30">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Two-factor authentication is under development
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                When available, you'll be able to secure your account with an
                authenticator app (Google Authenticator, Authy, etc.) for an
                extra layer of protection beyond your password. You'll receive
                backup codes in case you lose access to your device.
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                We'll notify you when 2FA is ready to enable.
              </p>
            </div>
          </div>
        </div>
      </DashboardPanel>

      {/* 3. Active sessions */}
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
            onClick={handleRevokeAll}
            disabled={
              !sessions.data ||
              sessions.data.filter((s) => !s.isCurrent).length === 0 ||
              revokeAll.isPending
            }
          >
            Sign out all others
          </Button>
        }
      >
        {sessions.isLoading && <ListSkeleton rows={3} />}
        {sessions.error && (
          <p className="text-sm text-red-500">Failed to load sessions</p>
        )}
        {sessions.data && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {sessions.data.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <DeviceIcon device={s.device} />
                  </div>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.browser} on {s.os}
                      {s.isCurrent && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          <Check className="h-2.5 w-2.5" />
                          This device
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {s.location} · {s.ip}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {s.isCurrent
                        ? "Active now"
                        : `Last seen ${formatDateShort(s.lastSeen)}`}
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
                    onClick={() => handleRevokeSession(s.id)}
                    disabled={revokeSession.isPending}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>

      {/* 4. Login history */}
      <DashboardPanel
        title="Login history"
        description="Recent sign-in activity on your account."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
        }
      >
        {loginHistory.isLoading && <ListSkeleton rows={4} />}
        {loginHistory.error && (
          <p className="text-sm text-red-500">Failed to load history</p>
        )}
        {loginHistory.data && (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 md:block">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50">
                    {["Date", "Device", "Location", "IP", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loginHistory.data.items.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">
                        {formatDateShort(e.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {e.browser} / {e.device}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {e.location}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {e.ip}
                      </td>
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
              {loginHistory.data.items.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDateShort(e.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </DashboardPanel>

      {/* 5. Notification preferences */}
      <DashboardPanel
        title="Notifications"
        description="Choose when and how PouchCare contacts you."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
            <Bell className="h-4 w-4" />
          </div>
        }
      >
        {securitySettings.isLoading && <ListSkeleton rows={6} />}
        {securitySettings.error && (
          <p className="text-sm text-red-500">Failed to load settings</p>
        )}
        {securitySettings.data && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <ToggleRow
              label="Order updates"
              description="Status changes, delivery confirmations, and revision requests."
              checked={securitySettings.data.orderUpdates}
              onChange={(v) => handleNotifUpdate("orderUpdates", v)}
            />
            <ToggleRow
              label="Billing & wallet alerts"
              description="Deposits confirmed, low balance warnings, payout results."
              checked={securitySettings.data.billingAlerts}
              onChange={(v) => handleNotifUpdate("billingAlerts", v)}
            />
            <ToggleRow
              label="System alerts"
              description="Maintenance windows, security events, and policy updates."
              checked={securitySettings.data.systemAlerts}
              onChange={(v) => handleNotifUpdate("systemAlerts", v)}
            />
            <ToggleRow
              label="New features & product news"
              description="Hear about new services, improvements, and announcements."
              checked={securitySettings.data.newFeatures}
              onChange={(v) => handleNotifUpdate("newFeatures", v)}
            />
            <ToggleRow
              label="Marketing emails"
              description="Promotions, seasonal offers, and partner deals."
              checked={securitySettings.data.marketingEmails}
              onChange={(v) => handleNotifUpdate("marketingEmails", v)}
            />
            <ToggleRow
              label="SMS alerts"
              description="Critical account alerts via text message."
              checked={securitySettings.data.smsAlerts}
              onChange={(v) => handleNotifUpdate("smsAlerts", v)}
            />
          </div>
        )}
      </DashboardPanel>

      {/* 6. Appearance — Mode + Accent color */}
      <DashboardPanel
        title="Appearance"
        description="Customize how your portal looks. Changes apply instantly."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
            <Palette className="h-4 w-4" />
          </div>
        }
      >
        <div className="space-y-6">
          {/* Mode selector */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme mode
            </p>
            <div className="grid grid-cols-3 gap-3 sm:max-w-md">
              {MODE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                    themeMode === value
                      ? "border-primary-400 bg-primary-50 ring-2 ring-primary-400/30 dark:border-primary-600 dark:bg-primary-950/40 dark:ring-primary-600/30"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800",
                  )}
                  aria-pressed={themeMode === value}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      themeMode === value
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      themeMode === value
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent color picker */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Accent color
            </p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map(({ value, label, hex }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccent(value)}
                  className={cn(
                    "group relative flex h-11 w-11 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12",
                    themeAccent === value
                      ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                      : "hover:scale-110",
                  )}
                  style={
                    themeAccent === value
                      ? ({ "--tw-ring-color": hex } as React.CSSProperties)
                      : undefined
                  }
                  aria-pressed={themeAccent === value}
                  aria-label={label}
                  title={label}
                >
                  <span
                    className="block h-8 w-8 rounded-full shadow-sm transition-transform sm:h-9 sm:w-9"
                    style={{ backgroundColor: hex }}
                  />
                  {themeAccent === value && (
                    <Check className="absolute h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </p>
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="primary" size="sm">
                  Primary button
                </Button>
                <Button type="button" variant="outline" size="sm">
                  Outline
                </Button>
                <Badge variant="sky">Badge</Badge>
                <Badge variant="success">Active</Badge>
                <span className="rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                  Accent tag
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="h-2 flex-1 rounded-full bg-primary-500" />
                <div className="h-2 w-1/3 rounded-full bg-primary-200 dark:bg-primary-800" />
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      {/* 7. Danger zone */}
      <DashboardPanel
        title="Danger zone"
        description="Irreversible account actions."
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Delete account
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Permanently remove your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              className="min-h-[44px] w-full shrink-0 whitespace-nowrap sm:w-auto"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete account
            </Button>
          </div>
        </div>
      </DashboardPanel>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete your account?"
        description="This will permanently delete your account and all data including orders, wallet balance, domains, and websites. This action cannot be undone. To proceed, contact support."
        confirmLabel="I understand"
        cancelLabel="Keep account"
        variant="danger"
        confirmDisabled={
          !userEmail ||
          deleteConfirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()
        }
        onConfirm={() => {
          setDeleteConfirm(false);
          setDeleteConfirmEmail("");
          toast.error(
            "Account deletion requires contacting support — this is a safety guard.",
          );
        }}
        onCancel={() => {
          setDeleteConfirm(false);
          setDeleteConfirmEmail("");
        }}
      >
        {userEmail ? (
          <div className="space-y-2">
            <Label htmlFor="delete-confirm-email">
              Type your email to confirm
            </Label>
            <Input
              id="delete-confirm-email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={userEmail}
              autoComplete="off"
              className="min-h-[44px]"
            />
            <HelpText>
              Enter <span className="font-semibold">{userEmail}</span> to enable
              the delete button.
            </HelpText>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Email confirmation is unavailable. Please sign in again and retry.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
