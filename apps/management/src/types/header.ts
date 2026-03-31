import type { LucideIcon } from 'lucide-react';

export interface Breadcrumb {
  label: string;
  href?: string;
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
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  hideOnMobile?: boolean;
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
