import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useCustomerAuth } from "../../portal/customer/auth/CustomerAuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useCustomerAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-light px-4">
        <div className="w-full max-w-md rounded-card bg-white p-8 shadow-card text-center">
          <h1 className="text-2xl font-bold font-heading text-heading">Invalid Link</h1>
          <p className="mt-2 text-sm text-muted">This password reset link is invalid or has expired.</p>
          <Link to="/customer/forgot-password" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate("/customer/login", { replace: true }), 3000);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4">
      <div className="w-full max-w-md">
        <div className="rounded-card bg-white p-8 shadow-card">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold font-heading text-heading">
              {success ? "Password reset!" : "Set new password"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {success
                ? "Your password has been updated. Redirecting to login..."
                : "Choose a strong password for your account."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
              Redirecting to login page...
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">New password</label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">Confirm password</label>
                <Input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/customer/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
