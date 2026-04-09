import { useState, useEffect } from 'react';
import { Bell, Menu, Search, X, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useHeaderStore } from '@/store/headerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useNotificationStore } from '@/store/notificationStore';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import type { HeaderAction, FilterAction } from '@/types/header';
import { AnimatePresence, motion } from 'framer-motion';

function Header() {
  const { actions } = useHeaderStore();
  const { openMobile } = useSidebarStore();
  const { unreadCount, togglePanel } = useNotificationStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Which filter is expanded inline (by index), or null
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const searchAction = actions?.find((a) => a.type === 'search') as Extract<HeaderAction, { type: 'search' }> | undefined;
  const filterActions = actions?.filter((a) => a.type === 'filter') as FilterAction[] ?? [];
  const otherActions = actions?.filter((a) => a.type !== 'search' && a.type !== 'filter') ?? [];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 6);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close panels when navigating away
  useEffect(() => {
    setSearchOpen(false);
    setActiveFilter(null);
  }, [actions?.length]);

  const toggleFilter = (idx: number) => {
    setSearchOpen(false);
    setActiveFilter((prev) => (prev === idx ? null : idx));
  };

  const openSearch = () => {
    setActiveFilter(null);
    setSearchOpen((prev) => !prev);
  };

  // The currently expanded filter (if any)
  const expandedFilter = activeFilter !== null ? filterActions[activeFilter] : null;

  return (
    <header
      className={cn(
        // Match Sidebar top bar (h-16) + solid bg so desktop chrome reads as one shell
        'sticky top-0 z-[35] border-b border-gray-200/80 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900 transition-shadow duration-200',
        scrolled && 'shadow-sm shadow-gray-200/60 dark:shadow-black/20',
      )}
    >
      <div className="flex h-16 items-center gap-1 px-3 lg:px-5">
        {/* Mobile menu */}
        <button
          onClick={openMobile}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Left: toggle & button actions */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
          {otherActions.map((action, i) => (
            <HeaderActionRenderer key={i} action={action} />
          ))}
        </div>

        {/* Right: filter icons + search + notifications */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Filter icons - each is a bare icon */}
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
                  'relative rounded-lg p-1.5 transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : hasValue
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300',
                )}
              >
                <Icon className="h-4 w-4" />
                {/* Active filter dot indicator */}
                {hasValue && !isActive && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}

          {/* Search toggle */}
          {searchAction && (
            <button
              onClick={openSearch}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                searchOpen
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300',
              )}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={togglePanel}
            aria-label="Notifications"
            className="relative rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable filter options panel */}
      <AnimatePresence mode="wait">
        {expandedFilter && (
          <motion.div
            key={`filter-${activeFilter}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700/40"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none lg:px-5">
              {/* "All" pill */}
              <button
                onClick={() => {
                  expandedFilter.onChange('');
                  setActiveFilter(null);
                }}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150',
                  !expandedFilter.value
                    ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                )}
              >
                All
              </button>

              {/* Option pills */}
              {expandedFilter.options
                .filter((o) => o.value !== '')
                .map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      expandedFilter.onChange(opt.value);
                      setActiveFilter(null);
                    }}
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-150',
                      expandedFilter.value === opt.value
                        ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable search bar */}
      <AnimatePresence>
        {searchOpen && searchAction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
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
    case 'toggle':
      return (
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-600/80 dark:bg-gray-800">
          {action.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => action.onChange(opt.value)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-150',
                action.value === opt.value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
              )}
            >
              {opt.icon && <opt.icon className="h-3 w-3" />}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      );

    case 'button':
      return (
        <Button
          variant={action.variant || 'primary'}
          size="sm"
          icon={action.icon && <action.icon />}
          onClick={action.onClick}
          className={cn(
            action.hideOnMobile && 'hidden sm:inline-flex',
            'h-8 shrink-0 rounded-md px-2.5 text-[11px] [&>span>svg]:h-3.5 [&>span>svg]:w-3.5',
          )}
        >
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      );

    case 'filter':
    case 'search':
      return null; // Handled separately

    case 'date-range':
      return null;

    default:
      return null;
  }
}

export { Header };
