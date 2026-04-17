import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useVerifyEmail, useResendVerification } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    if (!token) return;
    verifyEmail.mutateAsync(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email');
      return;
    }
    try {
      await resend.mutateAsync(resendEmail);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Verifying your email...</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email verified!</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Your email has been verified. You can now sign in to your account.
            </p>
            <div className="mt-8">
              <Link to="/portal/login">
                <Button fullWidth className="!bg-emerald-600 hover:!bg-emerald-700">
                  Sign in to Portal
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {token ? 'Verification failed' : 'Missing token'}
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {token
                ? 'This link is invalid or has expired. Request a new one below.'
                : 'No verification token found. Please check your email for the correct link.'}
            </p>

            <div className="mt-8 space-y-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your email to resend"
              />
              <Button onClick={handleResend} fullWidth isLoading={resend.isPending} variant="outline">
                Resend verification email
              </Button>
              <Link to="/portal/login" className="block">
                <Button variant="ghost" fullWidth>Back to login</Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
