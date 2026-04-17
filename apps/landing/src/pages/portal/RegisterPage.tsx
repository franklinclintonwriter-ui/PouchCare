/**
 * RegisterPage — create a client portal account.
 *
 * Migrated to the Week-1/2 UI kit: every row now goes through `<FormField>`
 * for a consistent label + aria-describedby wiring, the password gets a
 * live `<PasswordStrength>` meter, and the referral code from `?ref=` is
 * validated + surfaced so the user knows it stuck.
 */
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { HelpText } from "@/components/ui/HelpText";
import { paths } from "@/routes/paths";
import { usePortalRegister } from "@/api/portal-auth";

// Referral codes are short, alphanumeric, dash-separated. Silently strip
// anything else so malformed URLs don't trip the signup flow.
const REF_PATTERN = /^[A-Za-z0-9-]{3,32}$/;

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    country: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Only accept a ref that matches the pattern — a malformed `?ref=foo bar`
  // is silently dropped rather than forwarded to the server.
  const ref = useMemo(() => {
    const raw = searchParams.get("ref");
    if (!raw) return undefined;
    return REF_PATTERN.test(raw) ? raw : undefined;
  }, [searchParams]);

  const registerMutation = usePortalRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "", phone: "" },
    mode: "onBlur",
  });

  const password = watch("password") ?? "";

  const onSubmit = async (values: FormValues) => {
    try {
      await registerMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        country: values.country || undefined,
        phone: values.phone || undefined,
        ref,
      });
      toast.success("Check your email to verify your account.");
      navigate(`${paths.verifyEmail}?email=${encodeURIComponent(values.email)}`, {
        replace: true,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not register");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
        Create account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          to={paths.login}
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Sign in
        </Link>
      </p>

      {ref && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        >
          <span aria-hidden>🎁</span>
          Referred by <code className="font-mono">{ref}</code>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormField label="Full name" required error={errors.fullName?.message}>
          {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
            <Input
              id={id}
              autoComplete="name"
              aria-describedby={desc}
              aria-invalid={inv}
              aria-required={req}
              error={!!errors.fullName}
              {...register("fullName")}
            />
          )}
        </FormField>

        <FormField label="Email" required error={errors.email?.message}>
          {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              aria-describedby={desc}
              aria-invalid={inv}
              aria-required={req}
              error={!!errors.email}
              {...register("email")}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Country" showOptional>
            {({ id }) => (
              <Input id={id} autoComplete="country-name" {...register("country")} />
            )}
          </FormField>
          <FormField label="Phone" showOptional>
            {({ id }) => (
              <Input id={id} type="tel" autoComplete="tel" {...register("phone")} />
            )}
          </FormField>
        </div>

        <FormField
          label="Password"
          required
          error={errors.password?.message}
          help={
            !errors.password && password.length === 0 ? (
              <HelpText>
                Use at least 8 characters with a mix of letters, numbers and a symbol.
              </HelpText>
            ) : undefined
          }
        >
          {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
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
          {({ id, "aria-describedby": desc, "aria-invalid": inv, "aria-required": req }) => (
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
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
