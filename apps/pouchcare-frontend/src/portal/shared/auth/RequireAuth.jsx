import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { hasPermission } from "./permissions.js";
import { customerPath } from "../../../config/runtime.js";

/**
 * Shared "403 Access Denied" fallback shown when a user is authenticated
 * but lacks the required permission.
 */
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
      <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
      <p className="text-gray-600 max-w-md">
        You do not have permission to view this page. Contact your administrator
        if you believe this is an error.
      </p>
    </div>
  );
}

/**
 * Guard for admin routes. Redirects to /admin/login if unauthenticated.
 * If `permission` prop is provided, shows 403 if user lacks the permission.
 */
export function RequireAdminAuth({ children, permission }) {
  const { admin } = useAuth();
  const location = useLocation();

  // Show loading spinner while token validates on first load
  if (admin.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!admin.isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(admin.user.role, permission)) {
    return <AccessDenied />;
  }

  return children;
}

/**
 * Guard for customer routes. Redirects to customer login if unauthenticated.
 * If `permission` prop is provided, shows 403 if user lacks the permission.
 */
export function RequireCustomerAuth({ children, permission }) {
  const { customer } = useAuth();
  const location = useLocation();

  // Show nothing while token is being validated on first load
  if (customer.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer.isAuthenticated) {
    return <Navigate to={customerPath("/login")} state={{ from: location }} replace />;
  }

  if (permission && customer.user?.role && !hasPermission(customer.user.role, permission)) {
    return <AccessDenied />;
  }

  return children;
}
