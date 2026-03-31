import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setError('')
    try {
      const res = await api.post('/portal/login', data)
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      navigate('/')
    } catch (e: any) { setError(e.response?.data?.error || 'Login failed') }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-sora font-bold text-2xl text-white mx-auto mb-4 shadow-xl shadow-sky-500/25">P</div>
          <h1 className="font-sora text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your PouchCare account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-midnight-card border border-midnight-border rounded-2xl p-6 space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</div>}
          <Button type="submit" className="w-full mt-2" loading={isSubmitting}>Sign In →</Button>
          <div className="text-center pt-1">
            <Link to="/forgot-password" className="text-xs text-sky-500 hover:underline">Forgot password?</Link>
          </div>
        </form>
        <p className="text-sm text-center text-text-muted mt-4">
          No account? <Link to={`/register${searchParams.get('ref') ? `?ref=${searchParams.get('ref')}` : ''}`} className="text-sky-500 hover:underline font-medium">Create one free →</Link>
        </p>
      </div>
    </div>
  )
}
