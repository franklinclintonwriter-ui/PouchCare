import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { paths } from "@/routes/paths";
import {
  useResendVerification,
  useVerifyEmail,
  useVerifyEmailOtp,
} from "@/api/portal-auth";
import { cn } from "@/lib/cn";
import { accountInputClass } from "@/lib/ui";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";
  const { mutateAsync } = useVerifyEmail();
  const verifyOtp = useVerifyEmailOtp();
  const resend = useResendVerification();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    token ? "loading" : "idle",
  );
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [linkError, setLinkError] = useState<string>("");
  const [nextResendAt, setNextResendAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const attemptKey = `verify-email:attempted:${token}:${emailParam}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;
    if (typeof window !== "undefined") {
      const already = window.sessionStorage.getItem(attemptKey);
      if (already) return;
      window.sessionStorage.setItem(attemptKey, String(Date.now()));
    }
    setStatus("loading");
    setLinkError("");
    void mutateAsync(token)
      .then(() => {
        setStatus("ok");
        toast.success("Email verified");
      })
      .catch((e: unknown) => {
        setStatus("err");
        const raw =
          (e as { response?: { data?: { error?: string; message?: string } } })
            ?.response?.data?.error ??
          (e as { response?: { data?: { error?: string; message?: string } } })
            ?.response?.data?.message ??
          (e instanceof Error ? e.message : "Verification failed");
        const msg = String(raw ?? "Verification failed");
        const msgLower = msg.toLowerCase();
        if (msgLower.includes("expired")) {
          setLinkError(
            "This verification link has expired. Request a new code to continue.",
          );
        } else if (
          msgLower.includes("already") &&
          msgLower.includes("verified")
        ) {
          setLinkError("Your email is already verified. You can sign in.");
        } else if (
          msgLower.includes("invalid") ||
          msgLower.includes("not found")
        ) {
          setLinkError(
            "This verification link is invalid. Request a new code to continue.",
          );
        } else {
          setLinkError(msg);
        }
        toast.error(msg);
      });
  }, [token, emailParam, mutateAsync]);

  useEffect(() => {
    if (!nextResendAt) return;
    if (Date.now() >= nextResendAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [nextResendAt]);

  const resendSecondsLeft =
    nextResendAt > now ? Math.ceil((nextResendAt - now) / 1000) : 0;

  const submitOtp = useCallback(
    async (emailTrimmed: string, otpTrimmed: string) => {
      setOtpError("");
      setStatus("loading");
      try {
        await verifyOtp.mutateAsync({ email: emailTrimmed, otp: otpTrimmed });
        setStatus("ok");
        toast.success("Email verified");
      } catch (err: unknown) {
        setStatus("idle");
        const msg = err instanceof Error ? err.message : "Verification failed";
        setOtpError(msg);
        toast.error(msg);
      }
    },
    [verifyOtp],
  );

  useEffect(() => {
    if (token) return;
    if (status === "loading") return;
    const emailTrimmed = email.trim();
    const otpTrimmed = otp.trim();
    if (!emailTrimmed) return;
    if (otpTrimmed.length !== 6) return;
    void submitOtp(emailTrimmed, otpTrimmed);
  }, [token, status, email, otp, submitOtp]);

  if (status === "ok") {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Email verified
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
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

  if (!token) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Verify email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Enter the 6-digit code sent to your email.
        </p>
        {otpError && (
          <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {otpError}
          </p>
        )}
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOtpError("");
            const emailTrimmed = email.trim();
            const otpTrimmed = otp.trim();
            if (!emailTrimmed) {
              setOtpError("Enter your email");
              return;
            }
            if (otpTrimmed.length !== 6) {
              setOtpError("Enter the 6-digit code");
              return;
            }
            setStatus("loading");
            void verifyOtp
              .mutateAsync({ email: emailTrimmed, otp: otpTrimmed })
              .then(() => {
                setStatus("ok");
                toast.success("Email verified");
              })
              .catch((err: unknown) => {
                setStatus("idle");
                const msg =
                  err instanceof Error ? err.message : "Verification failed";
                setOtpError(msg);
                toast.error(msg);
              });
          }}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn("mt-1", accountInputClass)}
            />
          </div>
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Verification code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(next);
              }}
              className={cn("mt-1", accountInputClass)}
              placeholder="6-digit code"
            />
          </div>
          <Button
            type="submit"
            fullWidth
            className="touch-manipulation"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Verifying…" : "Verify email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="touch-manipulation"
            disabled={resend.isPending || resendSecondsLeft > 0}
            onClick={() => {
              const emailTrimmed = email.trim();
              if (!emailTrimmed) {
                toast.error("Enter your email");
                return;
              }
              void resend
                .mutateAsync(emailTrimmed)
                .then(() => {
                  toast.success("Verification email sent");
                  setNextResendAt(Date.now() + 60_000);
                })
                .catch((err: unknown) =>
                  toast.error(
                    err instanceof Error ? err.message : "Could not resend",
                  ),
                );
            }}
          >
            {resend.isPending
              ? "Sending…"
              : resendSecondsLeft > 0
                ? `Resend in ${resendSecondsLeft}s`
                : "Resend code"}
          </Button>
          <Link to={paths.login} className="block w-full">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              className="touch-manipulation"
            >
              Back to sign in
            </Button>
          </Link>
        </form>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Verifying…</p>
      </div>
    );
  }

  if (status === "err") {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Could not verify
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {linkError || "The link may be invalid or already used."}
        </p>
        <Link to={paths.login} className="mt-6 block w-full sm:max-w-xs">
          <Button type="button" fullWidth className="touch-manipulation">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }
  return null;
}
