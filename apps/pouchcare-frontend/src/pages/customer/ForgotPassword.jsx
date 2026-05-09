import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useCustomerAuth } from "../../portal/customer/auth/CustomerAuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
              {sent ? "Check your email" : "Forgot password?"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {sent
                ? "If an account exists with that email, we've sent a password reset link."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!sent ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">Email</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
              A password reset link has been sent. Please check your inbox and spam folder.
            </div>
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
