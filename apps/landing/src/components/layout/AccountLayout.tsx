import { Link, Outlet } from "react-router-dom";
import { Globe2 } from "lucide-react";

export function AccountLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
          <Link
            to="/"
            className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl py-1 pr-2 text-gray-900 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="truncate font-semibold">PouchCare</span>
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-2 text-sm font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-800"
          >
            Back to website
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-lg px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-10">
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
