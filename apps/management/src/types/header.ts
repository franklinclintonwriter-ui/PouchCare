import type { LucideIcon } from 'lucide-react';

export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export type HeaderAction =
  | SearchAction
  | FilterAction
  | ToggleAction
  | ButtonAction
  | DateRangeAction;

export interface SearchAction {
  type: 'search';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export interface FilterAction {
  type: 'filter';
  label: string;
  icon?: LucideIcon;
  options: { label: string; value: string; icon?: LucideIcon }[];
  value: string;
  onChange: (value: string) => void;
}

export interface ToggleAction {
  type: 'toggle';
  options: { label: string; value: string; icon?: LucideIcon }[];
  value: string;
  onChange: (value: string) => void;
}

export interface ButtonAction {
  type: 'button';
  label: string;
  /** Shown when `label` is empty or only the icon is visible (e.g. icon-only on small screens). */
  ariaLabel?: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  hideOnMobile?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface DateRangeAction {
  type: 'date-range';
  value: { start: string; end: string } | null;
  onChange: (value: { start: string; end: string } | null) => void;
}

export interface HeaderConfig {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: HeaderAction[];
}
