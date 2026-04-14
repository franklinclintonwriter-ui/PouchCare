/**
 * Hosting area shell: sub-navigation + Outlet.
 * See `pages/dashboard/HOSTING_PORTAL.md` for route order and responsive rules.
 */
import { NavLink, Outlet } from "react-router-dom";
import { Globe2, LayoutGrid, Search } from "lucide-react";
import { paths } from "@/routes/paths";

const tabs = [
  {
    to: paths.dashboardHosting,
    label: "My domains",
    end: true,
    icon: LayoutGrid,
  },
  {
    to: paths.dashboardHostingRegister,
    label: "Register & search",
    end: false,
    icon: Search,
  },
] as const;

export function HostingLayout() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="-mx-4 border-b border-gray-200/90 px-4 sm:mx-0 sm:rounded-xl sm:border sm:bg-white sm:shadow-sm">
        <div
          className="flex gap-1 overflow-x-auto overscroll-x-contain pb-px [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Hosting sections"
        >
          {tabs.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive
                  ? "flex min-h-[44px] shrink-0 snap-start items-center gap-2 border-b-2 border-primary-600 px-3 py-3 text-sm font-semibold text-primary-800 transition-colors sm:min-h-0 sm:rounded-t-lg sm:border-b-2 sm:bg-primary-50/60 sm:px-4 sm:py-3"
                  : "flex min-h-[44px] shrink-0 snap-start items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-gray-200 hover:text-gray-800 sm:min-h-0 sm:rounded-t-lg sm:border-b-2 sm:px-4 sm:py-3"
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-dashed border-primary-200/80 bg-primary-50/40 px-3 py-2.5 text-xs leading-relaxed text-primary-900 sm:text-sm">
        <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden />
        <p>
          <span className="font-semibold">Tip:</span> On small screens, domain
          lists show as cards; wider layouts use tables. Data is mock until API
          wiring.
        </p>
      </div>

      <Outlet />
    </div>
  );
}
