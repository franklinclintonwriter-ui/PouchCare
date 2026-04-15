import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import { accountInputClass } from "@/lib/ui";
import { cn } from "@/lib/cn";
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const reset = usePortalResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success("Password updated. Redirecting to sign in…");
      setTimeout(() => navigate(paths.login, { replace: true }), 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    }
  };

  if (!token) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Reset password
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          This link is invalid. Request a new reset email from the sign-in page.
        </p>
        <Link to={paths.forgotPassword} className="mt-6 block w-full sm:max-w-xs">
          <Button type="button" fullWidth className="touch-manipulation">
            Forgot password
          </Button>
        </Link>
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
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={cn("mt-1", accountInputClass)}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={cn("mt-1", accountInputClass)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
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
