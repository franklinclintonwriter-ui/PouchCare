import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }
    api.post('/portal/verify-email', { token }).then(() => setStatus('success')).catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center bg-midnight-card border border-midnight-border rounded-2xl p-8">
        {status === 'loading' && <><span className="text-5xl block mb-4">⏳</span><h2 className="font-sora text-xl font-bold">Verifying...</h2></>}
        {status === 'success' && <><span className="text-5xl block mb-4">🎉</span><h2 className="font-sora text-xl font-bold mb-2">Email Verified!</h2><p className="text-text-muted text-sm mb-6">Your account is active.</p><Link to="/login"><Button className="w-full">Sign In →</Button></Link></>}
        {status === 'error' && <><span className="text-5xl block mb-4">❌</span><h2 className="font-sora text-xl font-bold mb-2">Verification Failed</h2><p className="text-text-muted text-sm mb-6">Invalid or expired token.</p><Link to="/login"><Button variant="ghost" className="w-full">Back to Login</Button></Link></>}
      </div>
    </div>
  )
}
