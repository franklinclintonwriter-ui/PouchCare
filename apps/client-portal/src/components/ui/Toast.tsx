import { useUiStore } from '@/stores/uiStore'
export function ToastStack() {
  const { toasts, removeToast } = useUiStore()
  if (!toasts.length) return null
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div key={t.id} className="bg-midnight-card border border-midnight-border rounded-xl p-4 shadow-2xl animate-fade-up flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">{t.title}</p>
            {t.message && <p className="text-xs text-text-secondary mt-0.5">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-text-muted hover:text-text-primary text-lg leading-none flex-shrink-0">×</button>
        </div>
      ))}
    </div>
  )
}
