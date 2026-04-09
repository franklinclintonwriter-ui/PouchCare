import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import type { SystemRole } from '@/types/enums';
import type { PermissionKey } from '@/constants/permissionKeys';

interface AuthGuardProps {
  children: React.ReactNode;
  userType?: 'staff' | 'portal';
}

function AuthGuard({ children, userType }: AuthGuardProps) {
  const { isAuthenticated, userType: currentType, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = userType === 'portal' ? '/portal/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (userType && currentType !== userType) {
    return <Navigate to={currentType === 'portal' ? '/portal' : '/'} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: React.ReactNode;
  roles: SystemRole[];
  fallback?: React.ReactNode;
}

function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const perm = usePermission();

  if (!perm.role || !roles.includes(perm.role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/20">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
  fallback?: React.ReactNode;
}

function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const perm = usePermission();

  if (!perm.can(permission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/20">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userType, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={userType === 'portal' ? '/portal' : '/'} replace />;
  }

  return <>{children}</>;
}

export { AuthGuard, RoleGuard, PermissionGuard, GuestGuard };
