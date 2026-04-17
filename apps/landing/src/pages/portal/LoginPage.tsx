import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import { accountInputClass } from "@/lib/ui";
import { cn } from "@/lib/cn";
import { usePortalLogin } from "@/api/portal-auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? paths.dashboard;
  const login = usePortalLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login.mutateAsync(values);
      toast.success("Welcome back");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
        Sign in
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        New here?{" "}
        <Link
          to={paths.register}
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Create an account
        </Link>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={cn("mt-1", accountInputClass)}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Link
              to={paths.forgotPassword}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 sm:shrink-0"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={cn(accountInputClass, "pr-12")}
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="font-medium">Remember me</span>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:checked:bg-primary-500"
            defaultChecked
            {...register("remember")}
          />
        </label>

        <Button
          type="submit"
          fullWidth
          className="touch-manipulation"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
