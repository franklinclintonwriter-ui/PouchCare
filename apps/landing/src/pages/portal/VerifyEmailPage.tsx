import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import { useVerifyEmail } from "@/api/portal-auth";

const attempted = new Set<string>();

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutateAsync } = useVerifyEmail();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );

  useEffect(() => {
    if (!token) return;
    if (attempted.has(token)) return;
    attempted.add(token);
    setStatus("loading");
    void mutateAsync(token)
      .then(() => {
        setStatus("ok");
        toast.success("Email verified");
      })
      .catch((e: unknown) => {
        setStatus("err");
        toast.error(e instanceof Error ? e.message : "Verification failed");
      });
  }, [token, mutateAsync]);

  if (!token) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Verify email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Missing verification link. Open the link from your email.
        </p>
        <Link to={paths.login} className="mt-6 block w-full sm:max-w-xs">
          <Button type="button" fullWidth className="touch-manipulation">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="mt-4 text-sm text-gray-600">Verifying…</p>
      </div>
    );
  }

  if (status === "err") {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Could not verify
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          The link may be invalid or already used.
        </p>
        <Link to={paths.login} className="mt-6 block w-full sm:max-w-xs">
          <Button type="button" fullWidth className="touch-manipulation">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
        Email verified
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        You can now sign in to your client area.
      </p>
      <Link to={paths.login} className="mt-6 block w-full sm:max-w-xs">
        <Button type="button" fullWidth className="touch-manipulation">
          Sign in
        </Button>
      </Link>
    </div>
  );
}
