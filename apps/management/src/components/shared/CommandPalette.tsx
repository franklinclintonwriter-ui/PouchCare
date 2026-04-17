/**
 * Quick navigation for staff app routes (management). “Domains” here is /assets/domains → `/v1/assets`,
 * not client portal hosting (`/v1/portal/hosting`).
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useGlobalSearch } from '@/api/search';
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Clock, DollarSign,
  Target, Globe, HeadphonesIcon, BarChart3, Settings, Shield,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import type { PermissionKey } from '@/constants/permissionKeys';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
  category: string;
  permission?: PermissionKey;
  /** Managers and above only (see usePermission.isManager) */
  requireManager?: boolean;
}

function CommandPalette() {
  const perm = usePermission();

  const commands: CommandItem[] = useMemo(() => {
    const base: CommandItem[] = [
      { id: 'dashboard', label: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-4 w-4" />, category: 'Navigation' },
      { id: 'tasks', label: 'Tasks', href: '/tasks', icon: <CheckSquare className="h-4 w-4" />, category: 'Navigation' },
      { id: 'my-tasks', label: 'My Tasks', href: '/tasks/mine', icon: <CheckSquare className="h-4 w-4" />, category: 'Navigation' },
      { id: 'projects', label: 'Projects', href: '/projects', icon: <FolderKanban className="h-4 w-4" />, category: 'Navigation' },
      { id: 'staff', label: 'Staff Members', href: '/staff', icon: <Users className="h-4 w-4" />, category: 'Navigation' },
      { id: 'attendance', label: 'Attendance', href: '/attendance', icon: <Clock className="h-4 w-4" />, category: 'Navigation' },
      { id: 'payroll', label: 'Payroll', href: '/payroll', icon: <DollarSign className="h-4 w-4" />, category: 'Finance', permission: 'payroll.access' },
      { id: 'invoices', label: 'Invoices', href: '/finance/invoices', icon: <DollarSign className="h-4 w-4" />, category: 'Finance', permission: 'finance.access' },
      { id: 'leads', label: 'CRM Leads', href: '/crm/leads', icon: <Target className="h-4 w-4" />, category: 'Business', requireManager: true },
      { id: 'pipeline', label: 'Sales Pipeline', href: '/crm/pipeline', icon: <Target className="h-4 w-4" />, category: 'Business', requireManager: true },
      // Staff asset inventory, not portal “my domains”
      { id: 'domains', label: 'Domains', href: '/assets/domains', icon: <Globe className="h-4 w-4" />, category: 'Assets' },
      { id: 'support', label: 'Support Tickets', href: '/support', icon: <HeadphonesIcon className="h-4 w-4" />, category: 'Support' },
      { id: 'analytics', label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" />, category: 'Analytics', permission: 'analytics.access' },
      { id: 'settings', label: 'Settings', href: '/settings/profile', icon: <Settings className="h-4 w-4" />, category: 'Settings' },
    ];
    if (perm.can('settings.role_permissions')) {
      base.push({
        id: 'role-permissions',
        label: 'Role permissions',
        href: '/settings/role-permissions',
        icon: <Shield className="h-4 w-4" />,
        category: 'Settings',
        permission: 'settings.role_permissions',
      });
    }
    return base.filter(
      (c) =>
        (!c.requireManager || perm.isManager) &&
        (!c.permission || perm.can(c.permission)),
    );
  }, [perm]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useKeyboard([
    { key: 'k', ctrl: true, handler: () => setIsOpen(true) },
  ]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
    );
  }, [query, commands]);

  const { data: liveSearch } = useGlobalSearch(query);
  const liveCommands = useMemo<CommandItem[]>(() => {
    if (!query.trim() || !liveSearch?.results) return [];
    const out: CommandItem[] = [];
    const r = liveSearch.results;

    (r.staff ?? []).forEach((item) => out.push({
      id: `live-staff-${item.id}`,
      label: item.name,
      description: item.email,
      href: `/staff/${item.id}`,
      icon: <Users className="h-4 w-4" />,
      category: 'Staff',
    }));
    (r.tasks ?? []).forEach((item) => out.push({
      id: `live-task-${item.id}`,
      label: item.title,
      description: `Task #${item.taskId}`,
      href: `/tasks/${item.id}`,
      icon: <CheckSquare className="h-4 w-4" />,
      category: 'Tasks',
    }));
    (r.projects ?? []).forEach((item) => out.push({
      id: `live-project-${item.id}`,
      label: item.name,
      description: `Project #${item.projectId}`,
      href: `/projects/${item.id}`,
      icon: <FolderKanban className="h-4 w-4" />,
      category: 'Projects',
    }));
    if (perm.isManager) {
      (r.leads ?? []).forEach((item) => out.push({
        id: `live-lead-${item.id}`,
        label: item.company,
        description: `Lead #${item.leadId}`,
        href: `/crm/leads/${item.id}`,
        icon: <Target className="h-4 w-4" />,
        category: 'Leads',
      }));
    }
    (r.clients ?? []).forEach((item) => {
      if (perm.can('crm.client_accounts')) {
        out.push({
          id: `live-client-${item.id}`,
          label: item.fullName,
          description: item.email,
          href: `/crm/clients/${item.id}`,
          icon: <Users className="h-4 w-4" />,
          category: 'CRM Clients',
        });
      } else if (perm.can('admin_portal.access')) {
        out.push({
          id: `live-portal-${item.id}`,
          label: item.fullName,
          description: item.email,
          href: `/admin/portal/members/${item.id}`,
          icon: <Users className="h-4 w-4" />,
          category: 'Portal Members',
        });
      }
    });
    (r.domains ?? []).forEach((item) => out.push({
      id: `live-domain-${item.id}`,
      label: item.domainName,
      description: item.status,
      href: '/assets/domains',
      icon: <Globe className="h-4 w-4" />,
      category: 'Domains',
    }));

    return out;
  }, [liveSearch, query, perm]);

  const mergedResults = useMemo(() => {
    if (!query.trim()) return filtered;
    const combined = [...liveCommands, ...filtered];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.href + item.label)) return false;
      seen.add(item.href + item.label);
      return true;
    });
  }, [filtered, liveCommands, query]);

  function handleSelect(item: CommandItem) {
    navigate(item.href);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, mergedResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && mergedResults[selectedIndex]) {
      handleSelect(mergedResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700/60"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-gray-700/60">
                <Search className="h-4.5 w-4.5 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions..."
                  className="h-12 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin">
                {mergedResults.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">No results found</p>
                ) : (
                  mergedResults.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        i === selectedIndex
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300',
                      )}
                    >
                      <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{item.category}</p>
                      </div>
                      {i === selectedIndex && (
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2 dark:border-gray-700/60">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <kbd className="rounded border border-gray-200 px-1 py-0.5 dark:border-gray-600">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <kbd className="rounded border border-gray-200 px-1 py-0.5 dark:border-gray-600">↵</kbd>
                  Open
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export { CommandPalette };
