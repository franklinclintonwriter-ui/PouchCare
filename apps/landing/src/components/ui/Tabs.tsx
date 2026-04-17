/**
 * Tabs — ARIA tab / tabpanel pattern with keyboard navigation.
 *
 * Usage (simple string value):
 *   const [tab, setTab] = useState<Tab>('all')
 *   <Tabs value={tab} onChange={setTab}>
 *     <Tab value="all">All</Tab>
 *     <Tab value="pending">Pending</Tab>
 *     <Tab value="completed">Completed</Tab>
 *   </Tabs>
 *
 * Usage (fully composed with panels):
 *   <Tabs.Root value={tab} onChange={setTab}>
 *     <Tabs.List>
 *       <Tabs.Trigger value="orders">Orders</Tabs.Trigger>
 *       <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
 *     </Tabs.List>
 *     <Tabs.Panel value="orders">…</Tabs.Panel>
 *     <Tabs.Panel value="billing">…</Tabs.Panel>
 *   </Tabs.Root>
 *
 * Keyboard: ←/→ or Home/End move focus + activate the tab.
 * All triggers share a `tablist` role so screen readers announce the group.
 */
import {
  createContext,
  useContext,
  useId,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type TabValue = string;

interface TabsContextValue {
  value: TabValue;
  onChange: (v: TabValue) => void;
  idPrefix: string;
  register: (v: TabValue, el: HTMLButtonElement | null) => void;
  values: () => TabValue[];
}
const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsRootProps {
  value: TabValue;
  onChange: (v: TabValue) => void;
  /** Overall wrapper class. */
  className?: string;
  children: ReactNode;
}

function TabsRoot({ value, onChange, className, children }: TabsRootProps) {
  const idPrefix = useId();
  const registry = useRef(new Map<TabValue, HTMLButtonElement>());
  const register = useCallback((v: TabValue, el: HTMLButtonElement | null) => {
    if (el) registry.current.set(v, el);
    else registry.current.delete(v);
  }, []);
  const values = useCallback(() => Array.from(registry.current.keys()), []);
  return (
    <TabsContext.Provider value={{ value, onChange, idPrefix, register, values }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
}

function TabsList({ "aria-label": ariaLabel, className, children }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg bg-gray-100/70 p-1 dark:bg-gray-800/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: TabValue;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function TabsTrigger({ value, disabled, children, className }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.Trigger must be used inside Tabs.Root / Tabs");
  const { value: active, onChange, idPrefix, register, values } = ctx;
  const selected = active === value;

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const list = values();
    const idx = list.indexOf(value);
    if (idx < 0) return;
    let next: TabValue | null = null;
    if (e.key === "ArrowRight") next = list[(idx + 1) % list.length];
    else if (e.key === "ArrowLeft") next = list[(idx - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    if (next) {
      e.preventDefault();
      onChange(next);
      // Defer focus move to after React commits the new active tab.
      requestAnimationFrame(() => {
        const el = document.getElementById(`${idPrefix}-tab-${next}`);
        (el as HTMLElement | null)?.focus();
      });
    }
  };

  return (
    <button
      ref={(el) => register(value, el)}
      type="button"
      role="tab"
      id={`${idPrefix}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${idPrefix}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      onKeyDown={handleKey}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
        selected
          ? "bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface TabsPanelProps {
  value: TabValue;
  /** Mount the panel even when not the active tab (keeps internal state alive). */
  keepMounted?: boolean;
  className?: string;
  children: ReactNode;
}

function TabsPanel({ value, keepMounted, className, children }: TabsPanelProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.Panel must be used inside Tabs.Root / Tabs");
  const { value: active, idPrefix } = ctx;
  const selected = active === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      hidden={!selected}
      className={className}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

/**
 * Tabs — convenience wrapper that combines Root + List.
 * Use this when your children are all Trigger buttons with no Panels (e.g.,
 * status filter bars on list pages).
 */
export interface TabsProps extends TabsRootProps {
  "aria-label"?: string;
  listClassName?: string;
}

function Tabs({ value, onChange, className, listClassName, "aria-label": ariaLabel, children }: TabsProps) {
  return (
    <TabsRoot value={value} onChange={onChange} className={className}>
      <TabsList aria-label={ariaLabel} className={listClassName}>
        {children}
      </TabsList>
    </TabsRoot>
  );
}

// Named sub-components for composition.
const Compound = Object.assign(Tabs, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
});

export { Compound as Tabs, TabsTrigger as Tab, TabsPanel };
