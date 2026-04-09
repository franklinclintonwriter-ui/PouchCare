import { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { CommandPalette } from '@/components/shared/CommandPalette';
import api from '@/api/client';
import { normalizeStaffUser } from '@/api/auth';
import type { StaffUser, PortalUser } from '@/types/auth';

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

    if (userType === 'portal') {
      if (user) {
        setLoading(false);
        return;
      }
      api
        .get('/portal/me')
        .then((res) => {
          useAuthStore.getState().setUser(res.data as PortalUser);
        })
        .catch(() => {
          useAuthStore.getState().logout();
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    // Staff: login payload may omit permissions — always hydrate from /staff/me until present
    const staff = user as StaffUser | null;
    if (staff?.permissions) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get('/staff/me')
      .then((res) => {
        const data = res.data as StaffUser;
        useAuthStore.getState().setUser(normalizeStaffUser(data));
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
