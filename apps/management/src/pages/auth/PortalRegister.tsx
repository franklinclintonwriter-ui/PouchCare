import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Globe2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePortalRegister } from '@/api/auth';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  country: z.string().optional(),
  phone: z.string().optional(),
  refCode: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function PortalRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerMutation = usePortalRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: '',
      phone: '',
      refCode: searchParams.get('ref') || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        country: data.country || undefined,
        phone: data.phone || undefined,
        ref: data.refCode || undefined,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            We&apos;ve sent a verification link to your email. Please verify to activate your account.
          </p>
          <div className="mt-8">
            <Button onClick={() => navigate('/portal/login')} variant="outline" fullWidth>
              Go to login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 left-16 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-16 right-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Globe2 className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">PouchCare Portal</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Join the network,
              <br />
              <span className="text-emerald-200">grow your business.</span>
            </h1>
            <ul className="space-y-3 text-emerald-200/80 text-base">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" /> Place orders with wallet credits</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" /> Track projects in real-time</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" /> Earn commissions via referrals</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" /> 24/7 support portal</li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex flex-1 items-start sm:items-center overflow-y-auto bg-gray-50 px-6 py-12 dark:bg-gray-900">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Globe2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PouchCare Portal</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start using PouchCare services today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
              <input
                type="text"
                autoComplete="name"
                {...register('fullName')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Min 8 chars"
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
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Repeat password"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Country <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g. United States"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Referral code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                {...register('refCode')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="REF-XXXXXXXX"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={registerMutation.isPending}
              iconRight={<ArrowRight className="h-4 w-4" />}
              className="!bg-emerald-600 hover:!bg-emerald-700 focus-visible:!ring-emerald-500/40"
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/portal/login" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
