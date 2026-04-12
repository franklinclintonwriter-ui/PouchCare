import { useEffect } from 'react';
import { useHeaderStore } from '@/store/headerStore';
import type { HeaderConfig } from '@/types/header';

export function useHeaderConfig(config: HeaderConfig) {
  const setHeader = useHeaderStore((s) => s.setHeader);
  const clearHeader = useHeaderStore((s) => s.clearHeader);

  // Update header whenever config values change.
  // We serialize actions by their surface properties (type+value+label) so that
  // callback identity changes (which happen every render) don't trigger re-sets,
  // but actual value changes (search text, filter selection) DO propagate.
  const actionKey =
    config.actions
      ?.map((a) => {
        if (a.type === 'button') {
          return `${a.type}${a.isLoading ? ':loading' : ''}${a.disabled ? ':disabled' : ''}`;
        }
        return `${a.type}${'value' in a ? (a as { value: unknown }).value : ''}`;
      })
      .join('|') ?? '';

  const breadcrumbKey =
    config.breadcrumbs?.map((b) => `${b.label}:${b.href ?? ''}`).join('|') ?? '';

  useEffect(() => {
    setHeader(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.description, breadcrumbKey, actionKey, setHeader]);

  useEffect(() => {
    return () => clearHeader();
  }, [clearHeader]);
}
