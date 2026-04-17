/**
 * Enhanced client profile — 6 sections:
 * Identity · Contact · Company · Address · Account info · Linked services
 *
 * All fields now use API: usePortalMe() + useUpdateProfile()
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Copy,
  Globe,
  Lock,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  User,
  Wallet,
} from "lucide-react";
import { usePortalMe } from "@/api/portal-auth";
import { useUpdateProfile } from "@/api/portal-dashboard";
import { usePortalWallet } from "@/api/portal-dashboard";
import { usePortalOrders } from "@/api/portal-dashboard";
import { usePortalDomains } from "@/api/portal-hosting";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Avatar } from "@/components/ui/Avatar";
import { FileUpload } from "@/components/ui/FileUpload";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { formatUsd, formatDateShort } from "@/lib/format";
import {
  COUNTRIES,
  INDUSTRIES,
} from "@/data/constants";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { paths } from "@/routes/paths";

// ── Zod schemas ────────────────────────────────────────────────────────────
const identitySchema = z.object({
  fullName: z.string().min(2, "At least 2 characters"),
});

const contactSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  skype: z.string().optional(),
  preferredContact: z.enum(["phone", "whatsapp", "telegram", "email"]).optional(),
});

const companySchema = z.object({
  companyName: z.string().optional(),
  vatId: z.string().optional(),
  companyWebsite: z.string().optional(),
  industry: z.string().optional(),
});

const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  addressCountry: z.string().optional(),
});

// ── Types ──────────────────────────────────────────────────────────────────
type IdentityForm = z.infer<typeof identitySchema>;
type ContactForm = z.infer<typeof contactSchema>;
type CompanyForm = z.infer<typeof companySchema>;
type AddressForm = z.infer<typeof addressSchema>;

// ── Small helpers ──────────────────────────────────────────────────────────
function SectionIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-gray-500 dark:text-gray-400">{label}</Label>
      <div className="mt-1 min-h-[44px] flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {value || <span className="text-gray-400 italic">—</span>}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-11 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const me = usePortalMe();
  const update = useUpdateProfile();
  const wallet = usePortalWallet();
  const orders = usePortalOrders(1, 1);
  const domainsQuery = usePortalDomains(1, 100);

  // Avatar state — preview only until the backend upload endpoint ships.
  // TODO(api): POST /portal/me/avatar then replace the preview flow with
  // an actual upload mutation. See audit docs/client-portal/todos/ProfilePage.md.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFiles, setAvatarFiles] = useState<File[]>([]);

  // ── Identity form ──────────────────────────────────────────────────
  const identity = useForm<IdentityForm>({ resolver: zodResolver(identitySchema) });
  const resetIdentity = identity.reset;
  useEffect(() => {
    if (me.data) resetIdentity({ fullName: me.data.fullName });
  }, [me.data, resetIdentity]);

  const saveIdentity = async (v: IdentityForm) => {
    try {
      await update.mutateAsync({ fullName: v.fullName });
      toast.success("Name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  // ── Contact form ───────────────────────────────────────────────────
  const contact = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });
  const resetContact = contact.reset;
  useEffect(() => {
    const d = me.data;
    if (d) {
      resetContact({
        phone: d.phone ?? "",
        whatsapp: d.whatsapp ?? "",
        telegram: d.telegram ?? "",
        skype: d.skype ?? "",
        preferredContact: d.preferredContact ?? "email",
      });
    }
  }, [me.data, resetContact]);

  const saveContact = async (v: ContactForm) => {
    try {
      await update.mutateAsync({
        phone: v.phone || undefined,
        whatsapp: v.whatsapp || undefined,
        telegram: v.telegram || undefined,
        skype: v.skype || undefined,
        preferredContact: v.preferredContact || undefined,
      });
      toast.success("Contact info saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  // ── Company form ───────────────────────────────────────────────────
  const company = useForm<CompanyForm>({ resolver: zodResolver(companySchema) });
  const resetCompany = company.reset;
  useEffect(() => {
    const d = me.data;
    if (d) {
      resetCompany({
        companyName: d.companyName ?? "",
        vatId: d.vatId ?? "",
        companyWebsite: d.companyWebsite ?? "",
        industry: d.industry ?? "",
      });
    }
  }, [me.data, resetCompany]);

  const saveCompany = async (v: CompanyForm) => {
    try {
      await update.mutateAsync({
        companyName: v.companyName || undefined,
        vatId: v.vatId || undefined,
        companyWebsite: v.companyWebsite || undefined,
        industry: v.industry || undefined,
      });
      toast.success("Company info saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  // ── Address form ───────────────────────────────────────────────────
  const address = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });
  const resetAddress = address.reset;
  useEffect(() => {
    const d = me.data;
    if (d) {
      resetAddress({
        addressLine1: d.addressLine1 ?? "",
        addressLine2: d.addressLine2 ?? "",
        city: d.city ?? "",
        state: d.state ?? "",
        zip: d.zip ?? "",
        addressCountry: d.addressCountry ?? "",
      });
    }
  }, [me.data, resetAddress]);

  const saveAddress = async (v: AddressForm) => {
    try {
      await update.mutateAsync({
        addressLine1: v.addressLine1 || undefined,
        addressLine2: v.addressLine2 || undefined,
        city: v.city || undefined,
        state: v.state || undefined,
        zip: v.zip || undefined,
        addressCountry: v.addressCountry || undefined,
      });
      toast.success("Address saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // Called by the shared FileUpload primitive whenever the file set changes.
  // We only ever keep one file (avatar is single-upload). Revoking the old
  // preview URL avoids a memory leak on rapid re-selection.
  const handleAvatarFiles = (files: File[]) => {
    setAvatarFiles(files);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (files.length === 0) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setAvatarPreview(url);
    toast.success("Avatar preview updated (backend upload coming soon)");
  };

  const user = me.data;

  if (me.isLoading) return <ProfileSkeleton />;

  if (me.isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          Failed to load profile
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {me.error instanceof Error ? me.error.message : "Please try again."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void me.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your identity, contact info, company details, and billing address.
          </p>
        </div>
        {user && (
          <Badge variant={user.status === "active" ? "success" : "warning"}>
            {user.status === "active" ? "Active" : (user.status ?? "Pending")}
          </Badge>
        )}
      </div>

      {/* ── Identity ──────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Identity"
        description="Your display name and avatar."
        action={
          <SectionIcon icon={User} color="bg-primary-50 text-primary-600" />
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 sm:items-start lg:items-center w-full sm:max-w-md lg:max-w-none lg:w-auto">
            <div className="flex flex-col items-center gap-3 lg:flex-col lg:items-center">
              {avatarPreview || user?.avatarUrl ? (
                <img
                  src={avatarPreview ?? user?.avatarUrl ?? ""}
                  alt={user?.fullName ?? "Avatar"}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white shadow-md sm:h-24 sm:w-24"
                />
              ) : (
                <Avatar
                  name={user?.fullName}
                  size="md"
                  className="!h-20 !w-20 !rounded-2xl text-2xl sm:!h-24 sm:!w-24"
                />
              )}
              <FileUpload
                files={avatarFiles}
                onChange={handleAvatarFiles}
                accept="image/png, image/jpeg, image/webp"
                maxSizeMb={2}
                hint="PNG, JPG or WebP up to 2 MB"
                label={
                  <>
                    Drop photo here, or{" "}
                    <span className="text-primary-600 underline-offset-2 hover:underline">
                      browse
                    </span>
                  </>
                }
                className="w-full sm:w-64"
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              Upload saves as a preview — backend endpoint coming soon.
            </p>
          </div>

          {/* Name form */}
          <form
            onSubmit={identity.handleSubmit(saveIdentity)}
            className="flex-1 space-y-4"
          >
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                className="mt-1 min-h-[44px]"
                {...identity.register("fullName")}
              />
              {identity.formState.errors.fullName && (
                <p className="mt-1 text-xs text-red-600">
                  {identity.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <ReadonlyField label="Email address" value={user?.email ?? ""} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email changes require re-verification. Contact support to update.
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={!identity.formState.isDirty || update.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {update.isPending ? "Saving…" : "Save name"}
            </Button>
          </form>
        </div>
      </DashboardPanel>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Contact"
        description="How we and your team can reach you."
        action={<SectionIcon icon={Phone} color="bg-emerald-50 text-emerald-600" />}
      >
        <form
          onSubmit={contact.handleSubmit(saveContact)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+880 …"
              className="mt-1 min-h-[44px]"
              {...contact.register("phone")}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+880 …"
              className="mt-1 min-h-[44px]"
              {...contact.register("whatsapp")}
            />
          </div>
          <div>
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              placeholder="@handle"
              className="mt-1 min-h-[44px]"
              {...contact.register("telegram")}
            />
          </div>
          <div>
            <Label htmlFor="skype">Skype</Label>
            <Input
              id="skype"
              placeholder="skype ID"
              className="mt-1 min-h-[44px]"
              {...contact.register("skype")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="preferredContact">Preferred contact method</Label>
            <select
              id="preferredContact"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
              {...contact.register("preferredContact")}
            >
              {(["email", "phone", "whatsapp", "telegram"] as const).map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!contact.formState.isDirty || update.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {update.isPending ? "Saving…" : "Save contact info"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      {/* ── Company ───────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Company"
        description="Used on invoices and order correspondence."
        action={<SectionIcon icon={Building2} color="bg-violet-50 text-violet-600" />}
      >
        <form
          onSubmit={company.handleSubmit(saveCompany)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              placeholder="Acme Inc."
              className="mt-1 min-h-[44px]"
              {...company.register("companyName")}
            />
          </div>
          <div>
            <Label htmlFor="vatId">VAT / Tax ID</Label>
            <Input
              id="vatId"
              placeholder="VAT-000000"
              className="mt-1 min-h-[44px]"
              {...company.register("vatId")}
            />
          </div>
          <div>
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="https://example.com"
              className="mt-1 min-h-[44px]"
              {...company.register("companyWebsite")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
              {...company.register("industry")}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!company.formState.isDirty || update.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {update.isPending ? "Saving…" : "Save company info"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      {/* ── Address ───────────────────────────────────────────────────── */}
      <DashboardPanel
        title="Billing address"
        description="Used on invoices and for tax purposes."
        action={<SectionIcon icon={MapPin} color="bg-amber-50 text-amber-600" />}
      >
        <form
          onSubmit={address.handleSubmit(saveAddress)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              placeholder="123 Main St"
              className="mt-1 min-h-[44px]"
              {...address.register("addressLine1")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              placeholder="Apt, suite, etc."
              className="mt-1 min-h-[44px]"
              {...address.register("addressLine2")}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              className="mt-1 min-h-[44px]"
              {...address.register("city")}
            />
          </div>
          <div>
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              className="mt-1 min-h-[44px]"
              {...address.register("state")}
            />
          </div>
          <div>
            <Label htmlFor="zip">Postal / ZIP code</Label>
            <Input
              id="zip"
              className="mt-1 min-h-[44px]"
              {...address.register("zip")}
            />
          </div>
          <div>
            <Label htmlFor="addressCountry">Country</Label>
            <select
              id="addressCountry"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
              {...address.register("addressCountry")}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!address.formState.isDirty || update.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {update.isPending ? "Saving…" : "Save address"}
            </Button>
          </div>
        </form>
      </DashboardPanel>

      {/* ── Account info ──────────────────────────────────────────────── */}
      <DashboardPanel
        title="Account information"
        description="Read-only registration and verification details."
        action={<SectionIcon icon={BadgeCheck} color="bg-sky-50 text-sky-600" />}
      >
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Account ID", value: user?.id ?? "—" },
            {
              label: "Joined",
              value: user?.registrationDate ? formatDateShort(user.registrationDate) : "—",
            },
            {
              label: "Email status",
              value: user?.status === "active" ? "Verified" : (user?.status ?? "Pending"),
            },
            { label: "Referral code", value: user?.referralCode ?? "—" },
            { label: "Account status", value: user?.status ?? "Active" },
            { label: "Preferred currency", value: user?.country === "BD" ? "BDT" : "USD" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="relative rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="mt-1 flex items-center gap-2 break-all text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span className="min-w-0 flex-1">{value}</span>
                {value && value !== "—" && value !== "Not verified" && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value, label)}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-primary-600 dark:hover:bg-gray-700"
                    aria-label={`Copy ${label}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </DashboardPanel>

      {/* ── Linked services ───────────────────────────────────────────── */}
      <DashboardPanel
        title="Linked services"
        description="A snapshot of your active portfolio."
        action={<SectionIcon icon={Globe} color="bg-rose-50 text-rose-600" />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active orders</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {orders.isLoading ? "…" : (orders.data?.meta.total ?? 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Domains</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {domainsQuery.isLoading ? "…" : (domainsQuery.data?.items.length ?? 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Wallet balance</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {wallet.isLoading
                  ? "…"
                  : formatUsd(wallet.data?.walletBalance ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          <Lock className="mr-1 inline h-3 w-3" />
          Account security settings are managed under{" "}
          <Link to={paths.dashboardSettings} className="font-medium text-primary-600 hover:underline">
            Settings
          </Link>
          .
        </p>
      </DashboardPanel>
    </div>
  );
}
