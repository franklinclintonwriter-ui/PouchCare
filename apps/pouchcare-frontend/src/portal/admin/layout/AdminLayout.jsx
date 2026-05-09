import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { adminNav } from "../config/nav";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import { adminPath } from "../../../config/runtime";
import { portalBranding } from "../../shared/config/branding";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 transition-transform md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Link to={adminPath("/")} className="mb-6 block">
            <h1 className="text-xl font-semibold">{portalBranding.admin.title}</h1>
            <p className="text-sm text-slate-500">{portalBranding.admin.subtitle}</p>
          </Link>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const to = adminPath(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                    )
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col md:ml-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                <Menu className="h-4 w-4" />
                Menu
              </button>
              <p className="text-sm text-slate-500">{portalBranding.admin.tagline}</p>
              <Button as={Link} to={portalBranding.admin.backTo} size="sm" variant="secondary">
                {portalBranding.admin.backLabel}
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

