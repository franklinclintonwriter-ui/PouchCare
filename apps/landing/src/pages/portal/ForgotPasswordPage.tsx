import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import { accountInputClass } from "@/lib/ui";
import { cn } from "@/lib/cn";
import { useForgotPassword } from "@/api/portal-auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await forgot.mutateAsync(values.email);
      toast.success("If an account exists, you will receive reset instructions.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        Forgot password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Enter your email and we will send a reset link if an account exists.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
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
        <Button
          type="submit"
          fullWidth
          className="touch-manipulation"
          disabled={forgot.isPending}
        >
          {forgot.isPending ? "Sending…" : "Send reset link"}
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
