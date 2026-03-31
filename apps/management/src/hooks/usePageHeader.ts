import { useLayoutEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'

export function usePageHeader(title: string, subtitle?: string, actions?: React.ReactNode) {
  const setPageHeader = useUiStore((s) => s.setPageHeader)

  useLayoutEffect(() => {
    setPageHeader(title, subtitle, actions ?? null)
    return () => setPageHeader('', undefined, null)
  }, [setPageHeader, title, subtitle, actions])
}
