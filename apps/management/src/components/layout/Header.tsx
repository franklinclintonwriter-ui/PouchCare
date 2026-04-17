import { useState, useEffect } from "react";
import { Bell, Menu, Search, X, Filter } from "lucide-react";
import { cn } from "@/utils/cn";
import { useHeaderStore } from "@/store/headerStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useNotificationStore } from "@/store/notificationStore";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import type { HeaderAction, FilterAction } from "@/types/header";
import { AnimatePresence, motion } from "framer-motion";

function Header() {
  const { actions, title } = useHeaderStore();
  const { openMobile } = useSidebarStore();
  const {
    unreadCount,
    togglePanel,
    closePanel,
    isOpen: notificationsOpen,
  } = useNotificationStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const searchAction = actions?.find((a) => a.type === "search") as
    | Extract<HeaderAction, { type: "search" }>
    | undefined;
  const filterActions =
    (actions?.filter((a) => a.type === "filter") as FilterAction[]) ?? [];
  const otherActions =
    actions?.filter((a) => a.type !== "search" && a.type !== "filter") ?? [];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 6);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setActiveFilter(null);
  }, [actions?.length]);

  const toggleFilter = (idx: number) => {
    closePanel();
    setSearchOpen(false);
    setActiveFilter((prev) => (prev === idx ? null : idx));
  };

  const openSearch = () => {
    closePanel();
    setActiveFilter(null);
    setSearchOpen((prev) => !prev);
  };

  const openNotifications = () => {
    setSearchOpen(false);
    setActiveFilter(null);
    togglePanel();
  };

  const expandedFilter =
    activeFilter !== null ? filterActions[activeFilter] : null;

  return (
    <header
      className={cn(
        "no-print",
        "sticky top-0 z-[35] border-b border-gray-200/80 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900 transition-shadow duration-200",
        scrolled && "shadow-sm shadow-gray-200/60 dark:shadow-black/20",
      )}
    >
      <div className="flex h-14 items-center gap-2 px-3 lg:gap-3 lg:px-5">
        <button
          onClick={openMobile}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden lg:p-2"
          aria-label="Open menu"
        >
          <Menu className="h-[18px] w-[18px] lg:h-5 lg:w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h1 className="truncate pr-1 text-sm font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 lg:text-base">
                {title}
              </h1>
            ) : null}
          </div>

          {otherActions.length > 0 ? (
            <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 overflow-x-auto scrollbar-none">
              {otherActions.map((action, i) => (
                <HeaderActionRenderer key={i} action={action} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {filterActions.map((filter, idx) => {
            const Icon = filter.icon || Filter;
            const isActive = activeFilter === idx;
            const hasValue = !!filter.value;

            return (
              <button
                key={idx}
                onClick={() => toggleFilter(idx)}
                aria-label={filter.label}
                className={cn(
                  "relative rounded-lg p-1.5 transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                    : hasValue
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                )}
              >
                <Icon className="h-4 w-4" />
                {hasValue && !isActive && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}

          {searchAction && (
            <button
              onClick={openSearch}
              aria-label={searchOpen ? "Close search" : "Search"}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                searchOpen
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
              )}
            >
              {searchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            type="button"
            data-notification-bell
            onClick={openNotifications}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            className="relative flex touch-manipulation items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:active:bg-gray-700 lg:min-h-[40px] lg:min-w-[40px]"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {expandedFilter && (
          <motion.div
            key={`filter-${activeFilter}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700/40"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none lg:px-5">
              <button
                onClick={() => {
                  expandedFilter.onChange("");
                  setActiveFilter(null);
                }}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150",
                  !expandedFilter.value
                    ? "bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                All
              </button>

              {expandedFilter.options
                .filter((o) => o.value !== "")
                .map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      expandedFilter.onChange(opt.value);
                      setActiveFilter(null);
                    }}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150",
                      expandedFilter.value === opt.value
                        ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && searchAction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700/40"
          >
            <div className="px-3 py-2.5 lg:px-5">
              <SearchInput
                value={searchAction.value}
                onChange={searchAction.onChange}
                placeholder={searchAction.placeholder}
                className="w-full"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeaderActionRenderer({ action }: { action: HeaderAction }) {
  switch (action.type) {
    case "toggle":
      return (
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-600/80 dark:bg-gray-800">
          {action.options.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => action.onChange(opt.value)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-150",
                  action.value === opt.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400",
                )}
              >
                {OptIcon ? (
                  <OptIcon className="h-3 w-3 shrink-0" aria-hidden />
                ) : null}
                <span className={cn(OptIcon ? "hidden sm:inline" : "inline")}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      );

    case "button": {
      const ActionIcon = action.icon;
      const showLabelOnMobile = !ActionIcon;
      const accessibleName =
        action.ariaLabel?.trim() ||
        (action.label.trim() ? action.label : undefined);
      return (
        <Button
          variant={action.variant || "primary"}
          size="sm"
          icon={
            ActionIcon ? (
              <ActionIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : undefined
          }
          onClick={action.onClick}
          disabled={action.disabled}
          isLoading={action.isLoading}
          aria-label={ActionIcon ? accessibleName : undefined}
          className={cn(
            action.hideOnMobile && "hidden sm:inline-flex",
            "h-8 shrink-0 rounded-md px-2.5 text-[11px] [&>span>svg]:h-3.5 [&>span>svg]:w-3.5",
          )}
        >
          <span className={showLabelOnMobile ? "inline" : "hidden sm:inline"}>
            {action.label}
          </span>
        </Button>
      );
    }

    case "filter":
    case "search":
      return null;

    case "date-range":
      return null;

    default:
      return null;
  }
}

export { Header };
