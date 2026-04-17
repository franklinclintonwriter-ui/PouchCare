import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResetPassword } from '@/api/auth';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const type = (searchParams.get('type') as 'staff' | 'portal') || 'staff';
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, password: data.password, type });
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const loginPath = type === 'portal' ? '/portal/login' : '/login';

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password reset</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Your password has been updated successfully. You can now sign in.
          </p>
          <div className="mt-8">
            <Button onClick={() => navigate(loginPath)} fullWidth>Go to login</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid link</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-8">
            <Link to="/forgot-password">
              <Button variant="outline" fullWidth>Request a new link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set a new password</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                {...register('password')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
              placeholder="Repeat new password"
            />
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" fullWidth isLoading={resetPassword.isPending}>
            Reset password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
