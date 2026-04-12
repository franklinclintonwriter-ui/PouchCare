/** Keep in sync with apps/api/src/routes/tasks/constants.ts */
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
