/** Preset categories — CEO/Ops/branch managers pick these when creating work packages */
export const TASK_CATEGORIES = [
  'Apps',
  'SEO',
  'Web Dev',
  'Web Design',
  'Content',
  'Support',
  'Marketing',
  'Other',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]

export function isValidTaskCategory(c: string | undefined | null): c is TaskCategory {
  return !!c && (TASK_CATEGORIES as readonly string[]).includes(c)
}
