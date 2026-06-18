import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  useWorkspace, useWorkspaceSkills, useCreateSkill, useUpdateSkill, useDeleteSkill,
  useWorkspaceSettings, useSaveWorkspaceSettings,
} from '@/api/workspace'
import {
  Settings, BookOpen, Plus, Trash2, Code2, FileText, PenTool,
  Shield, Globe, Lightbulb, ToggleLeft, ToggleRight, Save, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

const SKILL_TEMPLATES: { name: string; content: string; category: string; icon: React.ReactNode }[] = [
  {
    name: 'TypeScript strict mode',
    content: 'Always use TypeScript with strict mode enabled. Prefer explicit types over `any`. Use interfaces for object shapes and type aliases for unions/intersections.',
    category: 'language',
    icon: <Code2 className="h-4 w-4 text-blue-500" />,
  },
  {
    name: 'React best practices',
    content: 'Use functional components with hooks. Prefer `useMemo` and `useCallback` for expensive computations. Keep components small and focused. Use proper key props in lists.',
    category: 'framework',
    icon: <Code2 className="h-4 w-4 text-cyan-500" />,
  },
  {
    name: 'Tailwind CSS conventions',
    content: 'Use Tailwind utility classes for styling. Follow mobile-first responsive design. Use `cn()` utility for conditional classes. Avoid inline styles.',
    category: 'styling',
    icon: <PenTool className="h-4 w-4 text-pink-500" />,
  },
  {
    name: 'Clean code principles',
    content: 'Write self-documenting code with clear variable names. Keep functions under 30 lines. Follow single responsibility principle. Add comments only for non-obvious logic.',
    category: 'quality',
    icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
  },
  {
    name: 'SEO content writing',
    content: 'Write for humans first, search engines second. Use H2/H3 headings with keywords. Keep paragraphs short (2-3 sentences). Include internal links. Meta descriptions under 160 chars.',
    category: 'content',
    icon: <Globe className="h-4 w-4 text-emerald-500" />,
  },
  {
    name: 'API design standards',
    content: 'Follow REST conventions. Use proper HTTP methods (GET/POST/PUT/DELETE). Return consistent JSON envelope: { success, data, meta }. Use Zod for request validation. Include proper error codes.',
    category: 'backend',
    icon: <Shield className="h-4 w-4 text-violet-500" />,
  },
  {
    name: 'Git commit conventions',
    content: 'Use conventional commits: feat:, fix:, docs:, refactor:, test:, chore:. Keep subject under 72 chars. Reference issue numbers when applicable.',
    category: 'workflow',
    icon: <FileText className="h-4 w-4 text-orange-500" />,
  },
  {
    name: 'Security first',
    content: 'Never hardcode secrets or API keys. Validate all user input. Use parameterized queries. Sanitize HTML output. Apply rate limiting to all endpoints. Use HTTPS everywhere.',
    category: 'security',
    icon: <Shield className="h-4 w-4 text-red-500" />,
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  language: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  framework: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  styling: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  quality: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  content: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  backend: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  workflow: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  security: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  custom: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function WorkspaceSettings() {
  const { id } = useParams<{ id: string }>()
  const { data: ws } = useWorkspace(id)
  const { data: skills } = useWorkspaceSkills(id)
  const { data: settings } = useWorkspaceSettings(id)
  const createSkill = useCreateSkill(id!)
  const updateSkill = useUpdateSkill(id!)
  const deleteSkill = useDeleteSkill(id!)
  const saveSettings = useSaveWorkspaceSettings(id!)

  const [createOpen, setCreateOpen] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [skillDesc, setSkillDesc] = useState('')
  const [skillContent, setSkillContent] = useState('')
  const [skillCategory, setSkillCategory] = useState('custom')

  // Settings state
  const [aiModel] = useState((settings as any)?.aiModel ?? '')
  const [autoSave, setAutoSave] = useState((settings as any)?.autoSave ?? true)
  const [tabSize, setTabSize] = useState(String((settings as any)?.tabSize ?? 2))
  const [fontSize, setFontSize] = useState(String((settings as any)?.fontSize ?? 13))

  const handleCreateSkill = useCallback(async () => {
    if (!skillName.trim() || !skillContent.trim()) return toast.error('Name and content required')
    try {
      await createSkill.mutateAsync({ name: skillName.trim(), description: skillDesc.trim() || undefined, content: skillContent.trim(), category: skillCategory })
      toast.success('Skill created')
      setCreateOpen(false); setSkillName(''); setSkillDesc(''); setSkillContent(''); setSkillCategory('custom')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }, [skillName, skillDesc, skillContent, skillCategory, createSkill])

  const handleAddTemplate = useCallback(async (t: typeof SKILL_TEMPLATES[0]) => {
    try {
      await createSkill.mutateAsync({ name: t.name, content: t.content, category: t.category })
      toast.success(`Added: ${t.name}`)
    } catch { toast.error('Failed') }
  }, [createSkill])

  const handleSaveSettings = useCallback(async () => {
    try {
      await saveSettings.mutateAsync({ aiModel, autoSave, tabSize: Number(tabSize), fontSize: Number(fontSize) })
      toast.success('Settings saved')
    } catch { toast.error('Failed') }
  }, [aiModel, autoSave, tabSize, fontSize, saveSettings])

  const activeCount = skills?.filter((s) => s.enabled).length ?? 0

  useHeaderConfig({
    title: `${ws?.name ?? 'Workspace'} — Settings`,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Workspaces', href: '/ai/workspace' }, { label: ws?.name ?? '...', href: `/ai/workspace/${id}` }, { label: 'Settings' }],
    actions: [],
  })

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={`/ai/workspace/${id}`} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Workspace settings</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ws?.name}</p>
          </div>
        </div>

        {/* Skills section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-500" />
                <CardTitle className="text-sm">AI Skills & Rules</CardTitle>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">{activeCount} active</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>Add skill</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Skills are persistent rules the AI follows in every interaction — chat, copilot, terminal, and code actions.</p>

            {/* Active skills */}
            {skills && skills.length > 0 ? (
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className={cn('flex items-start gap-3 rounded-xl border p-3 transition', skill.enabled ? 'border-violet-200 bg-violet-50/30 dark:border-violet-800/40 dark:bg-violet-950/10' : 'border-gray-200 bg-gray-50/50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50')}>
                    <button
                      onClick={async () => { try { await updateSkill.mutateAsync({ skillId: skill.id, enabled: !skill.enabled }); toast.success(skill.enabled ? 'Disabled' : 'Enabled') } catch {} }}
                      className="mt-0.5 shrink-0"
                    >
                      {skill.enabled ? <ToggleRight className="h-5 w-5 text-violet-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{skill.name}</span>
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium', CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.custom)}>{skill.category}</span>
                      </div>
                      {skill.description && <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{skill.description}</p>}
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{skill.content}</p>
                    </div>
                    <button
                      onClick={async () => { if (!confirm(`Delete "${skill.name}"?`)) return; try { await deleteSkill.mutateAsync(skill.id); toast.success('Deleted') } catch {} }}
                      className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-gray-700">
                <BookOpen className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No skills yet</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Add custom rules or pick from templates below</p>
              </div>
            )}

            {/* Templates */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick-add templates</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SKILL_TEMPLATES.filter((t) => !skills?.some((s) => s.name === t.name)).map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleAddTemplate(t)}
                    className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-violet-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-violet-700"
                  >
                    {t.icon}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">{t.content}</p>
                    </div>
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-cyan-500" />
              <CardTitle className="text-sm">Editor preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Tab size" type="number" value={tabSize} onChange={(e) => setTabSize(e.target.value)} />
              <Input label="Font size (px)" type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-save</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Save files automatically when switching tabs or losing focus</p>
              </div>
              <button onClick={() => setAutoSave((v: boolean) => !v)}>
                {autoSave ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
              </button>
            </div>
            <Button size="sm" onClick={handleSaveSettings} isLoading={saveSettings.isPending} icon={<Save className="h-3.5 w-3.5" />}>Save preferences</Button>
          </CardContent>
        </Card>
      </div>

      {/* Create skill modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create AI skill" size="sm"
        footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button isLoading={createSkill.isPending} onClick={handleCreateSkill}>Create</Button></>}>
        <div className="space-y-3">
          <Input label="Name" value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. Always use TypeScript" />
          <Input label="Description (optional)" value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} placeholder="Brief explanation" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rule content</label>
            <textarea
              value={skillContent}
              onChange={(e) => setSkillContent(e.target.value)}
              placeholder="The AI will follow this instruction in every interaction..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
