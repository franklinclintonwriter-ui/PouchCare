import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForgotPassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'staff' | 'portal') || 'staff';
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword.mutateAsync({ email: data.email, type });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const loginPath = type === 'portal' ? '/portal/login' : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          to={loginPath}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {!sent ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot your password?</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <Button type="submit" fullWidth isLoading={forgotPassword.isPending}>
                Send reset link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              If an account exists with that email, we&apos;ve sent a password reset link.
            </p>
            <div className="mt-8">
              <Link to={loginPath}>
                <Button variant="outline" fullWidth>Back to login</Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
