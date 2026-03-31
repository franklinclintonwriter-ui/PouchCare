import { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { CommandPalette } from '@/components/shared/CommandPalette';
import api from '@/api/client';

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const { isAuthenticated, userType, user, setLoading } = useAuthStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    const endpoint = userType === 'portal' ? '/portal/me' : '/staff/me';
    api
      .get(endpoint)
      .then((res) => {
        useAuthStore.getState().setUser(res.data);
      })
      .catch(() => {
        useAuthStore.getState().logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated, userType, user, setLoading]);

  const element = useRoutes(routes);

  return (
    <>
      {element}
      <CommandPalette />
    </>
  );
}
