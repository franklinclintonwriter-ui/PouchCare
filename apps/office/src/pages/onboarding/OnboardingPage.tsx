import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

const STEPS = [
  { icon: '👋', title: 'Welcome to PouchCare', body: 'This is your Staff Office — your daily hub for tasks, attendance, reports, and more.' },
  { icon: '✅', title: 'Manage Your Tasks', body: 'View tasks assigned to you. Submit progress, upload attachments, and receive CEO ratings.' },
  { icon: '🕐', title: 'Check In Daily', body: 'Hit Check In when you start work. Check Out when done. Your hours are tracked automatically.' },
  { icon: '📝', title: 'Submit Daily Reports', body: 'End each day with a brief report: what you did, what\'s next, and any blockers.' },
  { icon: '🚀', title: "You're ready!", body: 'Your dashboard is set up and waiting. Let\'s get to work!' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? 'w-6 h-2 bg-sky-500' : i < step ? 'w-2 h-2 bg-sky-500/50' : 'w-2 h-2 bg-midnight-border'}`} />
          ))}
        </div>

        <div className="bg-midnight-card border border-midnight-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">{current.icon}</div>
          <h2 className="font-sora text-2xl font-bold mb-3">{current.title}</h2>
          {step === 0 && <p className="text-sky-400 text-sm mb-2">Hi {user?.name?.split(' ')[0]} 👋</p>}
          <p className="text-text-secondary text-sm leading-relaxed mb-8">{current.body}</p>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">← Back</Button>
            )}
            <Button onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : navigate('/')} className="flex-1">
              {step < STEPS.length - 1 ? 'Next →' : 'Get Started 🚀'}
            </Button>
          </div>

          {step < STEPS.length - 1 && (
            <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text-secondary mt-4 transition-colors">
              Skip onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
