import { useUiStore } from '@/stores/uiStore'
import { useEffect } from 'react'

export function SlideOver() {
  const { slideOverOpen, slideOverContent, closeSlideOver } = useUiStore()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && closeSlideOver()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSlideOver])
  if (!slideOverOpen) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={closeSlideOver} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-midnight-card border-l border-midnight-border z-50 overflow-y-auto animate-slide-right shadow-2xl">
        <div className="p-6">{slideOverContent}</div>
      </div>
    </>
  )
}
