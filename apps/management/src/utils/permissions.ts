import type { SystemRole } from '@/types/enums';

const CEO_ROLES: SystemRole[] = ['CEO', 'CO_MD'];
const OPS_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER'];
const MANAGER_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'BRANCH_MANAGER', 'HR_MANAGER'];
const HR_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'];

const ROLE_ALIASES: Record<string, SystemRole> = {
  CEO: 'CEO',
  CO_MD: 'CO_MD',
  'CO-MD': 'CO_MD',
  CO_MD_: 'CO_MD',
  OP_MANAGER: 'OP_MANAGER',
  'OP MANAGER': 'OP_MANAGER',
  'OPERATION MANAGER': 'OP_MANAGER',
  'OPERATIONS MANAGER': 'OP_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  'HR MANAGER': 'HR_MANAGER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  'BRANCH MANAGER': 'BRANCH_MANAGER',
  STAFF: 'STAFF',
  INTERN: 'INTERN',
};

export function normalizeRole(role: string | null | undefined): SystemRole | null {
  if (!role) return null;
  const normalized = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ROLE_ALIASES[normalized] ?? null;
}

export function isCEO(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return CEO_ROLES.includes(r);
}

export function isOps(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return OPS_ROLES.includes(r);
}

export function isManager(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return MANAGER_ROLES.includes(r);
}

export function isHR(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return HR_ROLES.includes(r);
}

export function hasPermission(role: string | null | undefined, required: SystemRole[]): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return required.includes(r);
}

export function isCEOExact(role: SystemRole): boolean {
  return CEO_ROLES.includes(role);
}

export const ROLE_LABELS: Record<SystemRole, string> = {
  CEO: 'CEO',
  CO_MD: 'Co-MD',
  OP_MANAGER: 'Operations Manager',
  HR_MANAGER: 'HR Manager',
  BRANCH_MANAGER: 'Branch Manager',
  STAFF: 'Staff',
  INTERN: 'Intern',
};

export const ROLE_COLORS: Record<SystemRole, string> = {
  CEO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  CO_MD: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  OP_MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HR_MANAGER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  BRANCH_MANAGER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
  INTERN: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};
