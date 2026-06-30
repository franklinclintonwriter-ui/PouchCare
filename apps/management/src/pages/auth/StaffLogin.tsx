import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, ArrowRight, KeyRound, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStaffLogin } from '@/api/auth';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().default(true),
});

const totpSchema = z.object({
  totp: z.string().length(6, 'Enter the 6-digit code'),
});

type LoginForm = z.infer<typeof loginSchema>;
type TotpForm = z.infer<typeof totpSchema>;

export default function StaffLogin() {
  const navigate = useNavigate();
  const login = useStaffLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [requireTotp, setRequireTotp] = useState(false);
  const [credentials, setCredentials] = useState<LoginForm | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const totpForm = useForm<TotpForm>({
    resolver: zodResolver(totpSchema),
    defaultValues: { totp: '' },
  });

  const handleLogin = async (data: LoginForm) => {
    try {
      const result = await login.mutateAsync(data);
      if (result.requireTotp) {
        setCredentials(data);
        setRequireTotp(true);
        return;
      }
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleTotp = async (data: TotpForm) => {
    if (!credentials) return;
    try {
      await login.mutateAsync({ ...credentials, totp: data.totp });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">PouchCare</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your business
              <br />
              <span className="text-primary-200">all in one place.</span>
            </h1>
            <p className="text-primary-200/80 text-lg max-w-md">
              Projects, tasks, HR, finance, CRM — everything your team needs to stay aligned and productive.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PouchCare</span>
          </div>

          <AnimatePresence mode="wait">
            {!requireTotp ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your staff account</p>

                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      autoComplete="email"
                      {...loginForm.register('email')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
                      placeholder="you@company.com"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="mt-1.5 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...loginForm.register('password')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
                        placeholder="Enter your password"
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
                    {loginForm.formState.errors.password && (
                      <p className="mt-1.5 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...loginForm.register('remember')}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={login.isPending}
                    iconRight={<ArrowRight className="h-4 w-4" />}
                  >
                    Sign in
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you a client?{' '}
                    <Link to="/portal/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Sign in to Portal
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="totp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Two-factor auth</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>

                <form onSubmit={totpForm.handleSubmit(handleTotp)} className="mt-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verification code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        {...totpForm.register('totp')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-center text-lg tracking-[0.3em] font-mono text-gray-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400"
                        placeholder="000000"
                      />
                    </div>
                    {totpForm.formState.errors.totp && (
                      <p className="mt-1.5 text-xs text-red-500">{totpForm.formState.errors.totp.message}</p>
                    )}
                  </div>

                  <Button type="submit" fullWidth isLoading={login.isPending}>
                    Verify &amp; sign in
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setRequireTotp(false); setCredentials(null); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Back to login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
