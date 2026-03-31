import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

const schema = z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8), country: z.string().optional() })
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setError('')
    try { await api.post(`/portal/register${refCode ? `?ref=${refCode}` : ''}`, data); setSuccess(true) }
    catch (e: any) { setError(e.response?.data?.error || 'Registration failed') }
  }

  if (success) return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center bg-midnight-card border border-green-500/30 rounded-2xl p-8">
        <span className="text-5xl block mb-4">📧</span>
        <h2 className="font-sora text-xl font-bold mb-2">Check your email!</h2>
        <p className="text-text-muted text-sm">We sent a verification link. Click it to activate your account.</p>
        <Link to="/login" className="block mt-6 text-sky-500 hover:underline text-sm">← Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4">P</div>
          <h1 className="font-sora text-2xl font-bold">Create your account</h1>
          {refCode && <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1"><span className="text-green-400 text-xs">🎉 Referral: {refCode}</span></div>}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-midnight-card border border-midnight-border rounded-2xl p-6 space-y-4">
          <Input label="Full Name *" placeholder="John Smith" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email *" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password *" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
          <Input label="Country" placeholder="United States" {...register('country')} />
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</div>}
          <Button type="submit" className="w-full" loading={isSubmitting}>Create Account →</Button>
        </form>
        <p className="text-sm text-center text-text-muted mt-4">Already have an account? <Link to="/login" className="text-sky-500 hover:underline">Sign in →</Link></p>
      </div>
    </div>
  )
}
