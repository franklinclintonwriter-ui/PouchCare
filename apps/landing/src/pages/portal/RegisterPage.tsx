import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import { accountInputClass } from "@/lib/ui";
import { cn } from "@/lib/cn";
import { usePortalRegister } from "@/api/portal-auth";

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
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const registerMutation = usePortalRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "", phone: "" },
  });

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not register");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        Create account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Already have an account?{" "}
        <Link
          to={paths.login}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign in
        </Link>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            className={cn("mt-1", accountInputClass)}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
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
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Country (optional)
            </label>
            <input
              id="country"
              className={cn("mt-1", accountInputClass)}
              {...register("country")}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              className={cn("mt-1", accountInputClass)}
              {...register("phone")}
            />
          </div>
        </div>
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
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
