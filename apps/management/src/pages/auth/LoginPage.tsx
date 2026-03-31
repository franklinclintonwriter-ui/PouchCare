import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  totp: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [needsTotp, setNeedsTotp] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    setError('')
    try {
      const res = await api.post('/auth/login', data)
      if (res.data.data.requireTotp) { setNeedsTotp(true); return }
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-sora font-bold text-xl text-white mx-auto mb-4 shadow-lg shadow-sky-500/25">P</div>
          <h1 className="font-sora text-xl font-bold text-text-primary">Management Portal</h1>
          <p className="text-sm text-text-muted mt-1">PouchCare internal access only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-midnight-card border border-midnight-border rounded-2xl p-6 space-y-4">
          <Input label="Email" type="email" placeholder="you@pouchcare.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          {needsTotp && (
            <div>
              <p className="text-xs text-sky-400 mb-2">🔐 Enter your 2FA code</p>
              <Input label="2FA Code" placeholder="000000" maxLength={6} {...register('totp')} />
            </div>
          )}
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
          <Button type="submit" className="w-full mt-2" loading={isSubmitting}>
            Sign In →
          </Button>
          <p className="text-xs text-center text-text-muted pt-1">
            <a href="/" className="text-sky-500 hover:underline">Forgot password?</a>
          </p>
        </form>

        <p className="text-xs text-center text-text-muted mt-4">
          Staff portal? <a href={`${import.meta.env.VITE_OFFICE_URL || 'https://office.pouchcare.com.bd'}`} className="text-sky-500 hover:underline">office.pouchcare.com.bd ↗</a>
        </p>
      </div>
    </div>
  )
}
