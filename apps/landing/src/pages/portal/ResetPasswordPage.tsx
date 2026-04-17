/**
 * ResetPasswordPage — consume reset token, set new password, redirect.
 *
 * Migrated to FormField + PasswordStrength in the Week-2 sprint.
 * The invalid-token branch now offers a direct "Request a new link" CTA
 * instead of dumping a lone paragraph.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { paths } from "@/routes/paths";
import { usePortalResetPassword } from "@/api/portal-auth";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const reset = usePortalResetPassword();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const password = watch("password") ?? "";

  useEffect(() => {
    if (!token) return;
    if (!searchParams.get("token")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("token");
    setSearchParams(next, { replace: true });
  }, [token, searchParams, setSearchParams]);

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success("Password updated. Redirecting to sign in…");
      // Navigate immediately on success (no setTimeout race — see Week-1 fix).
      navigate(paths.login, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    }
  };

  if (!token) {
    return (
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          Link invalid or expired
        </div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Reset password
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          This reset link is no longer valid. Request a fresh one and we’ll
          email you a new link right away.
        </p>
        <Link
          to={paths.forgotPassword}
          className="mt-6 block w-full sm:max-w-xs"
        >
          <Button type="button" fullWidth className="touch-manipulation">
            Request a new link
          </Button>
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          Or{" "}
          <Link
            to={paths.login}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            back to sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        New password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Choose a strong password.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormField label="Password" required error={errors.password?.message}>
          {({
            id,
            "aria-describedby": desc,
            "aria-invalid": inv,
            "aria-required": req,
          }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-describedby={desc}
              aria-invalid={inv}
              aria-required={req}
              error={!!errors.password}
              {...register("password")}
            />
          )}
        </FormField>
        {password.length > 0 && <PasswordStrength value={password} />}

        <FormField
          label="Confirm password"
          required
          error={errors.confirmPassword?.message}
        >
          {({
            id,
            "aria-describedby": desc,
            "aria-invalid": inv,
            "aria-required": req,
          }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-describedby={desc}
              aria-invalid={inv}
              aria-required={req}
              error={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          )}
        </FormField>
        <Button
          type="submit"
          fullWidth
          className="touch-manipulation"
          disabled={reset.isPending}
        >
          {reset.isPending ? "Saving…" : "Update password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link
          to={paths.login}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
