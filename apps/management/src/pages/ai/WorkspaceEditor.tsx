import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useWorkspaceSessionStore } from '@/store/workspaceSessionStore'
import { PageTransition } from '@/components/ui/PageTransition'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace, useCreateFile, useUpdateFile, useDeleteFile, useWorkspaceCli, useUpdateWorkspaceContext, useLinkConversation, useGitHubStatus, useGitHubPush, useGitHubPull, useCopilotSuggest, useCopilotAction, useSshStatus, useSshToggle, useWorkspaceSkills, useWorkspaceResearch, type WsFile } from '@/api/workspace'
import { useAiStatus } from '@/api/ai'
import { useAiChat } from '@/features/ai/hooks/useAiChat'
import { AiChatPanel } from '@/features/ai/components/AiChatPanel'
import { AiMarkdownView } from '@/features/ai/components/AiMarkdownView'
import { AiModelSelector } from '@/features/ai/components/AiModelSelector'
import { getAccessToken } from '@/utils/storage'
import { getApiOrigin } from '@/config/apiOrigin'
import { cn } from '@/utils/cn'
import {
  FolderCode, FolderOpen, Folder, Plus, Save, Download,
  Terminal, X, ChevronRight, ChevronDown, RefreshCw, Bot, Sparkles,
  CornerDownLeft, Loader2, Zap, Maximize2, Minimize2,
  Fullscreen, Shrink, FileCode, ArrowLeft, MessageSquare,
  StickyNote, ListTodo, Brain, Globe, GitBranch,
  ArrowUpFromLine, ArrowDownToLine, FileSearch, Bug, BookOpen, Shuffle, Server, Settings2, Search,
} from 'lucide-react'
import { toast } from 'sonner'

// ── File Icon System ──────────────────────────────────────────
const ICON_COLORS: Record<string, { color: string; label: string }> = {
  ts: { color: '#3178c6', label: 'TS' }, tsx: { color: '#3178c6', label: 'TSX' },
  js: { color: '#f7df1e', label: 'JS' }, jsx: { color: '#f7df1e', label: 'JSX' },
  py: { color: '#3776ab', label: 'PY' }, go: { color: '#00add8', label: 'GO' },
  rs: { color: '#dea584', label: 'RS' }, java: { color: '#ed8b00', label: 'JA' },
  html: { color: '#e34c26', label: 'H' }, css: { color: '#1572b6', label: 'C' },
  scss: { color: '#cc6699', label: 'SC' }, json: { color: '#cbcb41', label: '{}' },
  md: { color: '#519aba', label: 'M' }, sql: { color: '#e38c00', label: 'SQ' },
  yaml: { color: '#cb171e', label: 'Y' }, yml: { color: '#cb171e', label: 'Y' },
  sh: { color: '#4eaa25', label: '$' }, bash: { color: '#4eaa25', label: '$' },
  php: { color: '#777bb4', label: 'P' }, rb: { color: '#cc342d', label: 'RB' },
  swift: { color: '#fa7343', label: 'SW' }, kt: { color: '#7f52ff', label: 'KT' },
  dart: { color: '#0175c2', label: 'DT' }, vue: { color: '#41b883', label: 'V' },
  svelte: { color: '#ff3e00', label: 'SV' }, xml: { color: '#e37933', label: 'X' },
  svg: { color: '#ffb13b', label: 'SVG' }, toml: { color: '#9c4121', label: 'T' },
  env: { color: '#ecd53f', label: 'E' }, txt: { color: '#89898a', label: 'TX' },
  csv: { color: '#237346', label: 'CSV' }, pdf: { color: '#ff0000', label: 'PDF' },
  png: { color: '#a074c4', label: 'IMG' }, jpg: { color: '#a074c4', label: 'IMG' },
  jpeg: { color: '#a074c4', label: 'IMG' }, gif: { color: '#a074c4', label: 'GIF' },
  webp: { color: '#a074c4', label: 'IMG' }, ico: { color: '#a074c4', label: 'ICO' },
  zip: { color: '#e0a800', label: 'ZIP' }, lock: { color: '#89898a', label: 'LK' },
  gitignore: { color: '#f05032', label: 'GI' }, dockerignore: { color: '#2496ed', label: 'DI' },
  dockerfile: { color: '#2496ed', label: 'DK' },
}

const SPECIAL_NAMES: Record<string, { color: string; label: string }> = {
  'package.json': { color: '#e8d44d', label: 'NPM' },
  'tsconfig.json': { color: '#3178c6', label: 'TS' },
  '.gitignore': { color: '#f05032', label: 'GIT' },
  '.env': { color: '#ecd53f', label: 'ENV' },
  '.env.local': { color: '#ecd53f', label: 'ENV' },
  'dockerfile': { color: '#2496ed', label: 'DK' },
  'docker-compose.yml': { color: '#2496ed', label: 'DC' },
  'readme.md': { color: '#519aba', label: 'RM' },
  'license': { color: '#d4aa00', label: 'LIC' },
  'makefile': { color: '#6d8086', label: 'MK' },
}

const FOLDER_COLORS: Record<string, string> = {
  src: '#42a5f5', components: '#7c4dff', pages: '#ff7043', lib: '#66bb6a',
  utils: '#ffca28', hooks: '#ab47bc', api: '#26c6da', styles: '#ec407a',
  public: '#8d6e63', assets: '#78909c', config: '#78909c', tests: '#ef5350',
  test: '#ef5350', '__tests__': '#ef5350', node_modules: '#616161',
  dist: '#9e9e9e', build: '#9e9e9e', '.git': '#f05032',
}

function FileIcon({ name, size = 14 }: { name: string; size?: number }) {
  const lowerName = name.toLowerCase()
  const special = SPECIAL_NAMES[lowerName]
  if (special) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-[3px] font-mono font-bold leading-none" style={{ width: size + 2, height: size + 2, fontSize: size * 0.5, backgroundColor: special.color + '22', color: special.color }}>
        {special.label}
      </span>
    )
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const icon = ICON_COLORS[ext]
  if (icon) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-[3px] font-mono font-bold leading-none" style={{ width: size + 2, height: size + 2, fontSize: size * 0.5, backgroundColor: icon.color + '22', color: icon.color }}>
        {icon.label}
      </span>
    )
  }
  return <FileCode className="shrink-0 text-gray-500" style={{ width: size, height: size }} />
}

function FolderIcon({ name, open, size = 14 }: { name: string; open: boolean; size?: number }) {
  const color = FOLDER_COLORS[name.toLowerCase()] ?? '#64b5f6'
  const Icon = open ? FolderOpen : Folder
  return <Icon className="shrink-0" style={{ width: size + 1, height: size + 1, color }} />
}

const LANG_MAP: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React',
  py: 'Python', go: 'Go', rs: 'Rust', java: 'Java', html: 'HTML', css: 'CSS',
  json: 'JSON', md: 'Markdown', sql: 'SQL', yaml: 'YAML', sh: 'Shell', txt: 'Text',
  php: 'PHP', rb: 'Ruby', vue: 'Vue', svelte: 'Svelte', xml: 'XML',
}

function getExt(name: string): string { return name.split('.').pop()?.toLowerCase() ?? '' }

interface TreeNode { file?: WsFile; name: string; path: string; isDir: boolean; children: TreeNode[] }

function buildTree(files: WsFile[]): TreeNode[] {
  const root: TreeNode[] = []; const dirMap = new Map<string, TreeNode>()
  for (const f of files) {
    const parts = f.path.split('/'); let current = root
    for (let i = 0; i < parts.length; i++) {
      const pp = parts.slice(0, i + 1).join('/'); const isLast = i === parts.length - 1
      if (isLast && !f.isDirectory) { current.push({ file: f, name: f.name, path: f.path, isDir: false, children: [] }) }
      else { let d = dirMap.get(pp); if (!d) { d = { file: isLast ? f : undefined, name: parts[i]!, path: pp, isDir: true, children: [] }; dirMap.set(pp, d); current.push(d) }; current = d.children }
    }
  }
  return root
}

function FileTreeItem({ node, depth, selected, onSelect, onDelete }: { node: TreeNode; depth: number; selected: string | null; onSelect: (f: WsFile) => void; onDelete: (f: WsFile) => void }) {
  const [open, setOpen] = useState(depth < 2)
  const isActive = node.file?.id === selected
  if (node.isDir) return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className={cn('flex w-full items-center gap-1.5 rounded px-1 py-[3px] text-left text-[12px] transition hover:bg-[#2a2d2e]', isActive && 'bg-[#37373d]')} style={{ paddingLeft: `${depth * 14 + 4}px` }}>
        {open ? <ChevronDown className="h-3 w-3 shrink-0 text-gray-500" /> : <ChevronRight className="h-3 w-3 shrink-0 text-gray-500" />}
        <FolderIcon name={node.name} open={open} />
        <span className="truncate text-[#cccccc]">{node.name}</span>
      </button>
      {open && node.children.map((c) => <FileTreeItem key={c.path} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} onDelete={onDelete} />)}
    </div>
  )
  return (
    <button type="button" onClick={() => node.file && onSelect(node.file)} className={cn('group flex w-full items-center gap-1.5 rounded px-1 py-[3px] text-left text-[12px] transition hover:bg-[#2a2d2e]', isActive && 'bg-[#094771] text-white')} style={{ paddingLeft: `${depth * 14 + 4}px` }}>
      <FileIcon name={node.name} />
      <span className="min-w-0 flex-1 truncate text-[#cccccc]">{node.name}</span>
      {node.file && <span onClick={(e) => { e.stopPropagation(); node.file && onDelete(node.file) }} className="shrink-0 rounded p-0.5 text-transparent transition group-hover:text-gray-500 hover:!text-red-400"><X className="h-3 w-3" /></span>}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function WorkspaceEditor() {
  const { id } = useParams<{ id: string }>()
  const { data: ws, isLoading, refetch } = useWorkspace(id)
  const { data: aiStatus } = useAiStatus()
  const createFile = useCreateFile(id!)
  const updateFile = useUpdateFile(id!)
  const deleteFile = useDeleteFile(id!)
  const cliMutation = useWorkspaceCli(id!)
  const updateContext = useUpdateWorkspaceContext(id!)
  const linkConv = useLinkConversation(id!)

  const [ideMode, setIdeModeRaw] = useState(() => {
    try { return localStorage.getItem(`ws-ide-${id}`) === '1' } catch { return false }
  })
  const setIdeMode = useCallback((v: boolean) => {
    setIdeModeRaw(v)
    try { if (v) localStorage.setItem(`ws-ide-${id}`, '1'); else localStorage.removeItem(`ws-ide-${id}`) } catch {}
  }, [id])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [contextPanelOpen, setContextPanelOpen] = useState(false)
  const [contextNotes, setContextNotes] = useState('')
  const [todos, setTodos] = useState('')
  const [contextDirty, setContextDirty] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [activeFile, setActiveFile] = useState<WsFile | null>(null)
  const [openTabs, setOpenTabs] = useState<WsFile[]>([])
  const [editorContent, setEditorContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [termOpen, setTermOpen] = useState(true)
  const [termExpanded, setTermExpanded] = useState(false)
  const [cliInput, setCliInput] = useState('')
  const [cliHistory, setCliHistory] = useState<{ cmd: string; output: string; isAi?: boolean; isError?: boolean }[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [copilotMode, setCopilotMode] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [githubPanelOpen, setGithubPanelOpen] = useState(false)
  const [copilotSuggestion, setCopilotSuggestion] = useState('')
  const [codeActionResult, setCodeActionResult] = useState<{ action: string; result: string } | null>(null)
  const [mobileTab, setMobileTab] = useState<'files' | 'editor' | 'chat' | 'terminal'>('editor')
  const isMobile = useIsMobile()
  const { data: wsSkills } = useWorkspaceSkills(id)
  const researchMut = useWorkspaceResearch(id!)
  const [researchOpen, setResearchOpen] = useState(false)
  const [researchQuery, setResearchQuery] = useState('')
  const [researchResult, setResearchResult] = useState<{ summary: string; analysis: string; steps: { tool: string; reason: string; success: boolean }[] } | null>(null)
  const { data: sshStatus } = useSshStatus()
  const sshToggle = useSshToggle(id!)
  const isSshEnabled = (ws as any)?.sshEnabled === true
  const sshConnected = Boolean(sshStatus?.connected && isSshEnabled)

  const { data: ghStatus } = useGitHubStatus()
  const ghPush = useGitHubPush(id!)
  const ghPull = useGitHubPull(id!)
  const copilotSuggestMut = useCopilotSuggest(id!)
  const copilotActionMut = useCopilotAction(id!)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const termEndRef = useRef<HTMLDivElement>(null)
  const cliInputRef = useRef<HTMLInputElement>(null)
  const autoSaveRef = useRef<{ dirty: boolean; contextDirty: boolean; editorContent: string; contextNotes: string; todos: string; activeFileId: string | null }>({ dirty: false, contextDirty: false, editorContent: '', contextNotes: '', todos: '', activeFileId: null })

  useEffect(() => {
    autoSaveRef.current = { dirty, contextDirty, editorContent, contextNotes, todos, activeFileId: activeFile?.id ?? null }
  }, [dirty, contextDirty, editorContent, contextNotes, todos, activeFile])

  useEffect(() => {
    const autoSave = async () => {
      const s = autoSaveRef.current
      if (s.dirty && s.activeFileId && id) {
        try { await updateFile.mutateAsync({ fileId: s.activeFileId, content: s.editorContent }) } catch { /* silent */ }
      }
      if (s.contextDirty && id) {
        try { await updateContext.mutateAsync({ contextNotes: s.contextNotes, todos: s.todos }) } catch { /* silent */ }
      }
    }
    const handleVisChange = () => { if (document.visibilityState === 'hidden') autoSave() }
    const handleBeforeUnload = () => autoSave()
    document.addEventListener('visibilitychange', handleVisChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    const interval = setInterval(autoSave, 30000)
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(interval)
    }
  }, [id, updateFile, updateContext])

  const activeModel = selectedModel || aiStatus?.defaultModel || ''
  const activeProvider = selectedModel ? aiStatus?.models?.find((m) => m.id === selectedModel)?.provider ?? aiStatus?.defaultProvider : aiStatus?.defaultProvider

  const { startSession, setConversationId: setSessionConvId } = useWorkspaceSessionStore()
  // Session cleanup on unmount — auto continue in background
  useEffect(() => {
    return () => {
      // Component unmounting means user navigated away — session continues in background
    }
  }, [])

  useEffect(() => {
    if (ws) {
      setContextNotes((ws as any).contextNotes ?? '')
      setTodos((ws as any).todos ?? '')
    }
  }, [ws])

  const fileTreeText = useMemo(() => {
    if (!ws) return ''
    if (!ws.files?.length) return '(no files yet — empty workspace)'
    return ws.files.map((f) => `${f.isDirectory ? 'd' : '-'} ${f.path}`).join('\n')
  }, [ws])

  const activeSkillsText = useMemo(() => {
    if (!wsSkills?.length) return ''
    const active = wsSkills.filter((s) => s.enabled)
    if (!active.length) return ''
    return `\nActive AI skills/rules:\n${active.map((s) => `- [${s.name}]: ${s.content}`).join('\n')}`
  }, [wsSkills])

  const aiContext = useMemo(() => {
    const parts = [`Workspace: ${ws?.name ?? ''}`]
    parts.push(`\nFile tree:\n${fileTreeText || '(no files yet — empty workspace)'}`)
    if (contextNotes.trim()) parts.push(`\nPersistent memory/notes:\n${contextNotes}`)
    if (todos.trim()) parts.push(`\nTODOs:\n${todos}`)
    if (activeSkillsText) parts.push(activeSkillsText)
    if (activeFile) parts.push(`\nCurrently editing: ${activeFile.path}\n${editorContent.slice(0, 3000)}`)
    return parts.join('\n')
  }, [ws?.name, fileTreeText, contextNotes, todos, activeSkillsText, activeFile, editorContent])

  const chat = useAiChat({
    useCase: 'CHAT',
    provider: activeProvider,
    model: activeModel || undefined,
    context: aiContext,
    workspaceId: id,
  })

  const { data: wsConvs } = useQuery<any[]>({
    queryKey: ['workspace-conversations', id],
    queryFn: async () => {
      const { default: apiClient } = await import('@/api/client')
      const { data } = await apiClient.get(`/ai/workspace/${id}/conversations`)
      return data as any[]
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  })
  const recentConvs = wsConvs ?? []
  const [convDropdownOpen, setConvDropdownOpen] = useState(false)
  const convDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!convDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (convDropdownRef.current && !convDropdownRef.current.contains(e.target as Node)) setConvDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [convDropdownOpen])

  // Start session when workspace loads
  useEffect(() => {
    if (ws && id) {
      startSession(id, ws.name, (ws as any).conversationId ?? null)
    }
  }, [ws?.name, id, startSession])

  // Load linked conversation on mount
  useEffect(() => {
    const linkedConvId = (ws as any)?.conversationId
    if (linkedConvId && !chat.conversationId && chat.messages.length === 0) {
      chat.loadConversation(linkedConvId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(ws as any)?.conversationId])

  // Update session + link conversation ID
  useEffect(() => {
    if (chat.conversationId) {
      setSessionConvId(chat.conversationId)
      if (id) linkConv.mutate(chat.conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.conversationId])

  const saveContext = useCallback(async () => {
    if (!id) return
    try {
      await updateContext.mutateAsync({ contextNotes, todos })
      setContextDirty(false)
      toast.success('Context saved')
    } catch { toast.error('Failed to save context') }
  }, [id, contextNotes, todos, updateContext])

  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [cliHistory])

  const selectFile = useCallback((f: WsFile) => {
    setActiveFile(f); setEditorContent(f.content ?? ''); setDirty(false)
    setOpenTabs((tabs) => tabs.find((t) => t.id === f.id) ? tabs : [...tabs, f])
  }, [])

  const closeTab = useCallback((fileId: string) => {
    setOpenTabs((tabs) => { const next = tabs.filter((t) => t.id !== fileId); if (activeFile?.id === fileId) { const l = next[next.length - 1]; if (l) { setActiveFile(l); setEditorContent(l.content ?? ''); setDirty(false) } else { setActiveFile(null); setEditorContent('') } }; return next })
  }, [activeFile])

  const handleSave = useCallback(async () => { if (!activeFile || !id) return; try { await updateFile.mutateAsync({ fileId: activeFile.id, content: editorContent }); setDirty(false); toast.success('Saved') } catch { toast.error('Save failed') } }, [activeFile, id, editorContent, updateFile])
  const handleNewFile = useCallback(async () => { if (!id) return; const n = prompt('File path (e.g. src/app.ts):'); if (!n?.trim()) return; try { const f = await createFile.mutateAsync({ path: n.trim() }); selectFile(f) } catch { toast.error('Failed') } }, [id, createFile, selectFile])
  const handleNewFolder = useCallback(async () => { if (!id) return; const n = prompt('Folder path:'); if (!n?.trim()) return; try { await createFile.mutateAsync({ path: n.trim(), isDirectory: true }) } catch { toast.error('Failed') } }, [id, createFile])
  const handleDelete = useCallback(async (f: WsFile) => { if (!confirm(`Delete "${f.name}"?`)) return; try { await deleteFile.mutateAsync(f.id); closeTab(f.id) } catch { toast.error('Failed') } }, [deleteFile, closeTab])

  const runCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) return; const t = cmd.trim(); setCliInput(''); setHistoryIdx(-1)
    setCmdHistory((h) => [t, ...h.filter((c) => c !== t)].slice(0, 50))
    if (t === 'clear' || t === 'cls') { setCliHistory([]); return }
    if (t === 'help') { setCliHistory((h) => [...h, { cmd: t, output: 'ls, mkdir, touch, cat, rm, mv, cp, tree, clear, help\nAI: "generate ...", "npm init", "scaffold ..."' }]); return }
    setCliHistory((h) => [...h, { cmd: t, output: '⏳' }])
    try { const r = await cliMutation.mutateAsync(t); setCliHistory((h) => { const c = [...h]; c[c.length - 1] = { cmd: t, output: r.output, isAi: r.filesChanged > 0 }; return c }); if (r.filesChanged > 0) refetch() }
    catch (e) { setCliHistory((h) => { const c = [...h]; c[c.length - 1] = { cmd: t, output: `Error: ${e instanceof Error ? e.message : 'failed'}`, isError: true }; return c }) }
  }, [cliMutation, refetch])

  const handleCli = useCallback(() => runCommand(cliInput), [cliInput, runCommand])

  const copilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestCopilotSuggestion = useCallback(() => {
    if (!copilotMode || !activeFile) return
    if (copilotTimerRef.current) clearTimeout(copilotTimerRef.current)
    copilotTimerRef.current = setTimeout(async () => {
      const lines = editorContent.split('\n')
      const cursorLine = lines.length - 1
      try {
        const res = await copilotSuggestMut.mutateAsync({ filePath: activeFile.path, content: editorContent, cursorLine, cursorCol: lines[cursorLine]?.length ?? 0 })
        if (res.suggestion) setCopilotSuggestion(res.suggestion)
      } catch { /* silent */ }
    }, 800)
  }, [copilotMode, activeFile, editorContent, copilotSuggestMut])

  const handleCodeAction = useCallback(async (action: 'explain' | 'fix' | 'docs' | 'refactor') => {
    if (!activeFile) return
    const selection = window.getSelection()?.toString() || editorContent
    try {
      const res = await copilotActionMut.mutateAsync({ action, code: selection.slice(0, 10000), filePath: activeFile.path })
      setCodeActionResult(res)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Action failed') }
  }, [activeFile, editorContent, copilotActionMut])

  const refreshPreview = useCallback(() => {
    if (previewRef.current) previewRef.current.src = previewRef.current.src
  }, [])
  const handleCliKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleCli() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const n = Math.min(historyIdx + 1, cmdHistory.length - 1); setHistoryIdx(n); if (cmdHistory[n]) setCliInput(cmdHistory[n]) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIdx <= 0) { setHistoryIdx(-1); setCliInput('') } else { const n = historyIdx - 1; setHistoryIdx(n); if (cmdHistory[n]) setCliInput(cmdHistory[n]) } }
  }, [handleCli, historyIdx, cmdHistory])

  const handleExportZip = useCallback(async () => {
    if (!id) return; try { const o = getApiOrigin() ?? ''; const t = getAccessToken(); const r = await fetch(`${o}/v1/ai/workspace/${id}/export/zip`, { method: 'POST', headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}) } }); if (!r.ok) { toast.error('Export failed'); return }; const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${ws?.name ?? 'workspace'}.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u) } catch { toast.error('Export failed') }
  }, [id, ws?.name])

  const tree = useMemo(() => ws ? buildTree(ws.files) : [], [ws])
  const ext = activeFile ? getExt(activeFile.name) : ''
  const lang = LANG_MAP[ext] ?? ext.toUpperCase()
  const lineCount = editorContent.split('\n').length
  const fileCount = ws?.files.length ?? 0

  const headerConfig = useMemo(() => ({
    title: ws?.name ?? 'Workspace',
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Workspaces', href: '/ai/workspace' }, { label: ws?.name ?? '...' }],
    actions: [
      { type: 'button' as const, label: 'IDE Mode', icon: Fullscreen, variant: 'primary' as const, onClick: () => setIdeMode(true) },
      { type: 'button' as const, label: 'Save', icon: Save, variant: 'secondary' as const, disabled: !dirty, onClick: handleSave },
      { type: 'button' as const, label: 'ZIP', icon: Download, variant: 'ghost' as const, onClick: handleExportZip },
    ],
  }), [ws?.name, dirty, handleSave, handleExportZip])
  useHeaderConfig(headerConfig, [dirty, handleSave, handleExportZip])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && copilotSuggestion) {
      e.preventDefault(); setEditorContent((v) => v + copilotSuggestion); setCopilotSuggestion(''); setDirty(true); return
    }
    if (e.key === 'Escape' && copilotSuggestion) { setCopilotSuggestion(''); return }
    if (e.key === 'Tab') { e.preventDefault(); const ta = e.currentTarget; const s = ta.selectionStart; const en = ta.selectionEnd; setEditorContent((v) => v.substring(0, s) + '  ' + v.substring(en)); setDirty(true); setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2 }, 0) }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave() }
    if (e.key === '`' && e.ctrlKey) { e.preventDefault(); setTermOpen((v) => !v) }
    if (e.key === 'b' && e.ctrlKey) { e.preventDefault(); setSidebarOpen((v) => !v) }
    if (e.key === 'j' && e.ctrlKey) { e.preventDefault(); setChatOpen((v) => !v) }
  }, [handleSave])

  if (isLoading) return <PageTransition><div className="flex h-96 items-center justify-center text-gray-400">Loading workspace...</div></PageTransition>

  // ── Mobile Layout — fullscreen overlay, hides management chrome ──
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-3 py-2">
            <div className="flex items-center gap-2">
              <Link to="/ai/workspace" className="text-gray-500"><ArrowLeft className="h-4 w-4" /></Link>
              <span className="truncate text-sm font-semibold text-white">{ws?.name}</span>
              {dirty && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </div>
            <div className="flex gap-1">
              {activeFile && <button onClick={handleSave} disabled={!dirty} className="rounded p-1.5 text-gray-400 hover:text-emerald-400 disabled:opacity-30"><Save className="h-4 w-4" /></button>}
              <button onClick={handleExportZip} className="rounded p-1.5 text-gray-400 hover:text-gray-200"><Download className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Mobile content */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileTab === 'files' && (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#333] px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Files ({fileCount})</span>
                  <div className="flex gap-1">
                    <button onClick={handleNewFile} className="rounded p-1 text-gray-500 hover:text-gray-300"><Plus className="h-4 w-4" /></button>
                    <button onClick={handleNewFolder} className="rounded p-1 text-gray-500 hover:text-gray-300"><Folder className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
                  {tree.length === 0 ? (
                    <div className="px-2 py-10 text-center text-[12px] leading-relaxed text-gray-600">
                      <p>No files yet — OK to start empty.</p>
                      <p className="mt-2 text-[11px] text-gray-500">Use + or AI Chat to plan and add files.</p>
                    </div>
                  ) : (
                    tree.map((n) => <FileTreeItem key={n.path} node={n} depth={0} selected={activeFile?.id ?? null} onSelect={(f) => { selectFile(f); setMobileTab('editor') }} onDelete={handleDelete} />)
                  )}
                </div>
              </div>
            )}

            {mobileTab === 'editor' && (
              <div className="flex h-full flex-col">
                {activeFile ? (
                  <>
                    <div className="flex items-center gap-2 border-b border-[#333] px-3 py-1.5">
                      <FileIcon name={activeFile.name} size={12} />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-gray-300">{activeFile.path}</span>
                      <span className="rounded bg-[#333] px-1.5 py-0.5 text-[9px] text-gray-400">{lang}</span>
                    </div>
                    <textarea value={editorContent} onChange={(e) => { setEditorContent(e.target.value); setDirty(true) }} onKeyDown={handleKeyDown} spellCheck={false}
                      className="min-h-0 flex-1 resize-none bg-[#1e1e1e] p-3 font-mono text-[13px] leading-[20px] text-[#d4d4d4] outline-none" style={{ tabSize: 2 }} />
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <FolderCode className="h-12 w-12 text-[#333]" />
                    <p className="mt-3 text-sm text-gray-500">No file open</p>
                    <button onClick={() => setMobileTab('files')} className="mt-2 text-xs text-[#007acc]">Browse files</button>
                  </div>
                )}
              </div>
            )}

            {mobileTab === 'chat' && (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#333] px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300"><Bot className="h-3.5 w-3.5 text-emerald-400" /> AI Chat</span>
                  {aiStatus?.models && <AiModelSelector models={aiStatus.models} value={activeModel} onChange={setSelectedModel} compact />}
                </div>
                <AiChatPanel chat={chat} provider={activeProvider} model={activeModel} placeholder="Ask about your code..." compact
                  suggestions={['Explain this file', 'Find bugs', 'Write tests', 'What should I build next?']}
                  className="flex-1 bg-[#1e1e1e] [&_textarea]:!bg-[#333] [&_textarea]:!border-[#444] [&_textarea]:!text-white" />
              </div>
            )}

            {mobileTab === 'terminal' && (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#333] px-3 py-1.5">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500"><Terminal className="h-3 w-3 text-emerald-400" /> Terminal</span>
                  {copilotMode && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400"><Zap className="mr-0.5 inline h-2.5 w-2.5" />Copilot</span>}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117] px-3 py-2 font-mono text-[12px] text-gray-300">
                  {cliHistory.length === 0 && <p className="py-1 text-gray-600">Type help or describe what to build.</p>}
                  {cliHistory.map((h, i) => (
                    <div key={i} className="mb-2">
                      <span className="text-emerald-400">❯ </span><span className="text-white">{h.cmd}</span>{h.isAi && <Sparkles className="ml-1 inline h-2.5 w-2.5 text-amber-400" />}
                      <pre className={cn('whitespace-pre-wrap pl-4', h.isError ? 'text-red-400' : 'text-gray-500')}>{h.output}</pre>
                    </div>
                  ))}
                  <div ref={termEndRef} />
                </div>
                <div className="flex items-center gap-2 border-t border-[#333] bg-[#1e1e1e] px-3 py-2">
                  <span className="text-emerald-400">❯</span>
                  <input ref={cliInputRef} value={cliInput} onChange={(e) => setCliInput(e.target.value)} onKeyDown={handleCliKey}
                    placeholder="command..." className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-700" disabled={cliMutation.isPending} autoComplete="off" spellCheck={false} />
                  {cliMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
                  <button onClick={handleCli} disabled={cliMutation.isPending || !cliInput.trim()} className="text-gray-600 hover:text-emerald-400"><CornerDownLeft className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile bottom nav */}
          <div className="flex h-12 shrink-0 items-center justify-around border-t border-[#333] bg-[#252526]">
            {([
              { id: 'files' as const, icon: FolderCode, label: 'Files' },
              { id: 'editor' as const, icon: FileCode, label: 'Editor' },
              { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
              { id: 'terminal' as const, icon: Terminal, label: 'Terminal' },
            ]).map((t) => (
              <button key={t.id} onClick={() => setMobileTab(t.id)}
                className={cn('flex flex-col items-center gap-0.5 px-3 py-1 transition', mobileTab === t.id ? 'text-[#007acc]' : 'text-gray-500')}>
                <t.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
      </div>
    )
  }

  // ── Desktop Layout ─────────────────────────────────────────
  const ideShell = (
    <div className={cn('flex overflow-hidden bg-[#1e1e1e] text-[#cccccc]', ideMode ? 'fixed inset-0 z-[200]' : 'h-[calc(100vh-8rem)] rounded-2xl border border-gray-200/90 shadow-sm dark:border-gray-700/60')}>

      {/* Activity bar */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 border-r border-[#333] bg-[#252526] py-2">
        <button onClick={() => setSidebarOpen((v) => !v)} className={cn('rounded-lg p-2 transition', sidebarOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="Explorer (Ctrl+B)"><FolderCode className="h-5 w-5" /></button>
        <button onClick={() => { setTermOpen(true); setTimeout(() => cliInputRef.current?.focus(), 100) }} className={cn('rounded-lg p-2 transition', termOpen ? 'text-white' : 'text-gray-500 hover:text-gray-300')} title="Terminal (Ctrl+`)"><Terminal className="h-5 w-5" /></button>
        <button onClick={() => setChatOpen((v) => !v)} className={cn('rounded-lg p-2 transition', chatOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="AI Chat (Ctrl+J)"><MessageSquare className="h-5 w-5" /></button>
        <button onClick={() => setPreviewOpen((v) => !v)} className={cn('rounded-lg p-2 transition', previewOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="Preview"><Globe className="h-5 w-5" /></button>
        <button onClick={() => setGithubPanelOpen((v) => !v)} className={cn('rounded-lg p-2 transition relative', githubPanelOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="GitHub">
          <GitBranch className="h-5 w-5" />
          {ghStatus?.connected && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400" />}
        </button>
        <button onClick={() => setResearchOpen((v) => !v)} className={cn('rounded-lg p-2 transition', researchOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="SEO Research"><Search className="h-5 w-5" /></button>
        <button onClick={() => setContextPanelOpen((v) => !v)} className={cn('rounded-lg p-2 transition', contextPanelOpen ? 'border-l-2 border-l-white bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300')} title="Context & Todos"><Brain className="h-5 w-5" /></button>
        <button
          onClick={async () => { try { const r = await sshToggle.mutateAsync(); toast.success(r.sshEnabled ? 'SSH enabled' : 'SSH disabled') } catch (e) { toast.error(e instanceof Error ? e.message : 'SSH toggle failed') } }}
          className={cn('relative rounded-lg p-2 transition', sshConnected ? 'text-emerald-400' : isSshEnabled ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300')}
          title={sshConnected ? `SSH: ${sshStatus?.host}` : 'Toggle SSH'}
        >
          <Server className="h-5 w-5" />
          {sshConnected && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />}
        </button>
        <button onClick={() => setCopilotMode((v) => !v)} className={cn('rounded-lg p-2 transition', copilotMode ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300')} title="AI Copilot"><Bot className="h-5 w-5" /></button>
        <div className="flex-1" />
        {ideMode && <button onClick={() => setIdeMode(false)} className="rounded-lg p-2 text-gray-500 transition hover:text-gray-300" title="Exit IDE"><Shrink className="h-4 w-4" /></button>}
        <Link to={`/ai/workspace/${id}/settings`} className="rounded-lg p-2 text-gray-500 transition hover:text-gray-300" title="Settings & Skills"><Settings2 className="h-4 w-4" /></Link>
        <button onClick={handleExportZip} className="rounded-lg p-2 text-gray-500 transition hover:text-gray-300" title="Export ZIP"><Download className="h-4 w-4" /></button>
      </div>

      {/* File explorer */}
      {sidebarOpen && (
        <div className="flex w-56 shrink-0 flex-col border-r border-[#333] bg-[#252526] lg:w-60">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Explorer</span>
            <div className="flex gap-0.5">
              <button onClick={handleNewFile} className="rounded p-1 text-gray-500 hover:text-gray-300" title="New file"><Plus className="h-3.5 w-3.5" /></button>
              <button onClick={handleNewFolder} className="rounded p-1 text-gray-500 hover:text-gray-300" title="New folder"><Folder className="h-3.5 w-3.5" /></button>
              <button onClick={() => refetch()} className="rounded p-1 text-gray-500 hover:text-gray-300" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="border-b border-[#333] px-3 pb-1.5">
            <p className="truncate text-[11px] font-semibold text-[#cccccc]">{ws?.name}</p>
            <p className="text-[10px] text-gray-600">{fileCount} files</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
            {tree.length === 0 ? (
              <div className="px-2 py-6 text-center text-[11px] leading-relaxed text-gray-600">
                <p>No files yet — this is fine.</p>
                <p className="mt-2 text-gray-500">Use <kbd className="rounded bg-[#333] px-1">+</kbd> for a file, the terminal to scaffold, or <kbd className="rounded bg-[#333] px-1">Ctrl+J</kbd> to plan with AI.</p>
              </div>
            ) : (
              tree.map((n) => <FileTreeItem key={n.path} node={n} depth={0} selected={activeFile?.id ?? null} onSelect={selectFile} onDelete={handleDelete} />)
            )}
          </div>
        </div>
      )}

      {/* Context & Todos panel */}
      {contextPanelOpen && (
        <div className="flex w-64 shrink-0 flex-col border-r border-[#333] bg-[#252526] lg:w-72">
          <div className="flex items-center justify-between border-b border-[#333] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <Brain className="h-3 w-3 text-violet-400" /> Memory & Todos
            </span>
            <div className="flex gap-1">
              {contextDirty && <button onClick={saveContext} className="rounded px-2 py-0.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/10">Save</button>}
              <button onClick={() => setContextPanelOpen(false)} className="rounded p-1 text-gray-500 hover:text-gray-300"><X className="h-3 w-3" /></button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-[#333] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <StickyNote className="h-3 w-3 text-amber-400" /> Persistent context
              </div>
              <p className="mt-1 text-[10px] text-gray-600">The AI always reads this. Add project goals, tech stack, conventions.</p>
              <textarea
                value={contextNotes}
                onChange={(e) => { setContextNotes(e.target.value); setContextDirty(true) }}
                placeholder="e.g. This is a Next.js 14 project using TypeScript, Tailwind, Prisma..."
                className="mt-2 w-full rounded-lg border border-[#333] bg-[#1e1e1e] p-2 font-mono text-[11px] leading-relaxed text-[#cccccc] outline-none placeholder:text-gray-700 focus:border-violet-500/50"
                rows={6}
                spellCheck={false}
              />
            </div>

            <div className="p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <ListTodo className="h-3 w-3 text-cyan-400" /> Workspace TODOs
              </div>
              <p className="mt-1 text-[10px] text-gray-600">Track tasks. The AI sees these and can suggest next steps.</p>
              <textarea
                value={todos}
                onChange={(e) => { setTodos(e.target.value); setContextDirty(true) }}
                placeholder={"- [ ] Set up project structure\n- [ ] Create database schema\n- [ ] Build API routes\n- [x] Initialize workspace"}
                className="mt-2 w-full rounded-lg border border-[#333] bg-[#1e1e1e] p-2 font-mono text-[11px] leading-relaxed text-[#cccccc] outline-none placeholder:text-gray-700 focus:border-cyan-500/50"
                rows={8}
                spellCheck={false}
              />
            </div>

            <div className="border-t border-[#333] p-3">
              <p className="text-[10px] text-gray-600">
                <span className="text-violet-400">Context</span> and <span className="text-cyan-400">TODOs</span> are injected into every AI interaction in this workspace — chat, terminal, and copilot.
              </p>
              {(ws as any)?.conversationId && (
                <p className="mt-2 text-[10px] text-gray-600">
                  Linked conversation: <span className="font-mono text-gray-400">{((ws as any).conversationId as string).slice(0, 8)}...</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center: editor + terminal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Tab bar */}
        <div className="flex h-[35px] items-center overflow-x-auto border-b border-[#333] bg-[#252526] scrollbar-none">
          {ideMode && <Link to="/ai/workspace" className="flex items-center gap-1 border-r border-[#333] px-3 text-[11px] text-gray-500 transition hover:text-gray-300"><ArrowLeft className="h-3 w-3" /></Link>}
          {openTabs.map((tab) => (
            <div key={tab.id} className={cn('group flex h-full items-center gap-1.5 border-r border-[#333] px-3 text-[12px] cursor-pointer transition', activeFile?.id === tab.id ? 'bg-[#1e1e1e] text-white border-t border-t-[#007acc]' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]')} onClick={() => selectFile(tab)}>
              <FileIcon name={tab.name} size={12} />
              <span className="max-w-[100px] truncate">{tab.name}</span>
              {activeFile?.id === tab.id && dirty && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }} className="ml-0.5 rounded text-transparent transition group-hover:text-gray-500 hover:!text-white"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>

        {/* Breadcrumb */}
        {activeFile && (
          <div className="flex items-center gap-2 border-b border-[#333] bg-[#1e1e1e] px-3 py-[3px]">
            <FileIcon name={activeFile.name} size={11} />
            <span className="text-[11px] text-gray-500">{activeFile.path}</span>
            <span className="ml-auto rounded bg-[#333] px-1.5 py-0.5 text-[9px] font-semibold text-gray-400">{lang}</span>
            <span className="text-[9px] text-gray-600">Ln {lineCount}</span>
          </div>
        )}

        {/* Editor */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1e1e1e]">
          {activeFile ? (
            <div className="flex h-full">
              <div className="w-[50px] shrink-0 overflow-hidden border-r border-[#333] bg-[#1e1e1e] pt-4 text-right font-mono text-[12px] leading-[20px] text-[#858585] select-none">
                {Array.from({ length: lineCount }, (_, i) => <div key={i} className="px-3">{i + 1}</div>)}
              </div>
              <div className="relative min-w-0 flex-1">
                <textarea value={editorContent} onChange={(e) => { setEditorContent(e.target.value); setDirty(true); requestCopilotSuggestion() }} onKeyDown={handleKeyDown} spellCheck={false}
                  className="absolute inset-0 resize-none border-0 bg-transparent p-4 font-mono text-[13px] leading-[20px] text-[#d4d4d4] outline-none caret-[#aeafad]" style={{ tabSize: 2 }} />
                {/* Copilot ghost suggestion */}
                {copilotSuggestion && (
                  <div className="pointer-events-none absolute bottom-2 left-4 right-4 rounded-lg bg-[#252526] px-3 py-2 font-mono text-[12px]">
                    <span className="text-gray-600 opacity-60">{copilotSuggestion.slice(0, 120)}{copilotSuggestion.length > 120 ? '...' : ''}</span>
                    <span className="ml-2 text-[10px] text-gray-600">Tab to accept</span>
                  </div>
                )}
              </div>
              {/* Code action toolbar */}
              {activeFile && (
                <div className="flex items-center gap-0.5 border-t border-[#333] bg-[#252526] px-2 py-1">
                  <span className="mr-1 text-[9px] font-semibold uppercase tracking-wider text-gray-600">Actions</span>
                  <button onClick={() => handleCodeAction('explain')} disabled={copilotActionMut.isPending} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-[#333] hover:text-gray-300" title="Explain"><FileSearch className="h-3 w-3" /> Explain</button>
                  <button onClick={() => handleCodeAction('fix')} disabled={copilotActionMut.isPending} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-[#333] hover:text-gray-300" title="Fix bugs"><Bug className="h-3 w-3" /> Fix</button>
                  <button onClick={() => handleCodeAction('docs')} disabled={copilotActionMut.isPending} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-[#333] hover:text-gray-300" title="Generate docs"><BookOpen className="h-3 w-3" /> Docs</button>
                  <button onClick={() => handleCodeAction('refactor')} disabled={copilotActionMut.isPending} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-[#333] hover:text-gray-300" title="Refactor"><Shuffle className="h-3 w-3" /> Refactor</button>
                  {copilotActionMut.isPending && <Loader2 className="ml-1 h-3 w-3 animate-spin text-emerald-400" />}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <FolderCode className="h-20 w-20 text-[#333]" />
              <p className="mt-4 text-sm text-gray-500">No file open</p>
              <p className="mt-1 max-w-sm text-[11px] text-gray-600">Select from the explorer, use the terminal, or open AI Chat — it works even with an empty project.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <span className="rounded bg-[#252526] px-2 py-1"><kbd className="text-gray-400">Ctrl+S</kbd> Save</span>
                <span className="rounded bg-[#252526] px-2 py-1"><kbd className="text-gray-400">Ctrl+`</kbd> Terminal</span>
                <span className="rounded bg-[#252526] px-2 py-1"><kbd className="text-gray-400">Ctrl+B</kbd> Sidebar</span>
                <span className="rounded bg-[#252526] px-2 py-1"><kbd className="text-gray-400">Ctrl+J</kbd> AI Chat</span>
              </div>
            </div>
          )}
        </div>

        {/* Terminal */}
        {termOpen && (
          <div className={cn('flex shrink-0 flex-col border-t border-[#333] transition-all', termExpanded ? 'h-[50vh]' : 'h-44')}>
            <div className="flex items-center justify-between bg-[#252526] px-3 py-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500"><Terminal className="h-3 w-3 text-emerald-400" /> Terminal</span>
                {copilotMode && <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400"><Zap className="h-2.5 w-2.5" /> Copilot</span>}
              </div>
              <div className="flex gap-0.5">
                <button onClick={() => setTermExpanded((v) => !v)} className="rounded p-1 text-gray-600 hover:text-gray-300">{termExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}</button>
                <button onClick={() => setTermOpen(false)} className="rounded p-1 text-gray-600 hover:text-gray-300"><X className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117] px-3 py-2 font-mono text-[12px] text-gray-300">
              {cliHistory.length === 0 && <p className="py-1 text-gray-600">Type <span className="text-gray-400">help</span> or describe what to build.</p>}
              {cliHistory.map((h, i) => (
                <div key={i} className="mb-2">
                  <span className="text-emerald-400">❯ </span><span className="text-white">{h.cmd}</span>{h.isAi && <Sparkles className="ml-1 inline h-2.5 w-2.5 text-amber-400" />}
                  <pre className={cn('whitespace-pre-wrap pl-4', h.isError ? 'text-red-400' : 'text-gray-500')}>{h.output}</pre>
                </div>
              ))}
              <div ref={termEndRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-[#252526] bg-[#1e1e1e] px-3 py-1.5">
              <span className="text-emerald-400 text-[12px]">❯</span>
              <input ref={cliInputRef} value={cliInput} onChange={(e) => setCliInput(e.target.value)} onKeyDown={handleCliKey}
                placeholder={copilotMode ? 'AI — describe what to build...' : 'command...'} className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-gray-700" disabled={cliMutation.isPending} autoComplete="off" spellCheck={false} />
              {cliMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />}
              <button onClick={handleCli} disabled={cliMutation.isPending || !cliInput.trim()} className="text-gray-600 hover:text-emerald-400 disabled:opacity-30"><CornerDownLeft className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="flex h-[22px] items-center justify-between border-t border-[#333] bg-[#007acc] px-3 text-[11px] text-white/90">
          <div className="flex items-center gap-3">
            {copilotMode && <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Copilot</span>}
            {sshConnected && <span className="flex items-center gap-1"><Server className="h-3 w-3" /> SSH: {sshStatus?.host}</span>}
            <span>{ws?.name}</span>
            <span>{fileCount} files</span>
          </div>
          <div className="flex items-center gap-3">
            {activeFile && <><span>Ln {lineCount}</span><span>{lang}</span></>}
            <span>UTF-8</span>
            {dirty && <span className="text-amber-200">Modified</span>}
            {sshConnected && <span className="flex items-center gap-1 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> SSH</span>}
          </div>
        </div>
      </div>

      {/* Right panels */}
      {chatOpen && !previewOpen && !githubPanelOpen && (
        <div className="flex w-80 shrink-0 flex-col border-l border-[#333] bg-[#252526] lg:w-96">
          {/* Chat header with history dropdown */}
          <div className="flex items-center justify-between border-b border-[#333] px-3 py-2">
            <div className="relative flex items-center gap-1.5" ref={convDropdownRef}>
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <button onClick={() => setConvDropdownOpen((v) => !v)} className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 transition hover:text-white">
                {chat.conversationId ? 'Chat' : 'New chat'}
                <ChevronDown className={cn('h-3 w-3 text-gray-500 transition', convDropdownOpen && 'rotate-180')} />
              </button>

              {convDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[#444] bg-[#252526] shadow-xl">
                  <button
                    onClick={() => { chat.reset(); setConvDropdownOpen(false) }}
                    className="flex w-full items-center gap-2 border-b border-[#333] px-3 py-2 text-left text-[11px] font-medium text-emerald-400 transition hover:bg-[#2a2d2e]"
                  >
                    <Plus className="h-3 w-3" /> New conversation
                  </button>
                  <div className="max-h-56 overflow-y-auto">
                    {recentConvs.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[10px] text-gray-600">No conversations yet</p>
                    ) : (
                      recentConvs.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={async () => { await chat.loadConversation(c.id); setConvDropdownOpen(false) }}
                          className={cn(
                            'flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-[#2a2d2e]',
                            chat.conversationId === c.id && 'bg-[#094771]',
                          )}
                        >
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-gray-300">{c.title || 'Untitled'}</p>
                            <p className="mt-0.5 text-[9px] text-gray-600">{new Date(c.createdAt).toLocaleDateString()} · {c.totalTokens?.toLocaleString() ?? 0} tk</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {aiStatus?.models && <AiModelSelector models={aiStatus.models} value={activeModel} onChange={setSelectedModel} compact />}
              <button onClick={() => setChatOpen(false)} className="rounded p-1 text-gray-500 hover:text-gray-300"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {/* Code action result */}
          {codeActionResult && (
            <div className="border-b border-[#333] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{codeActionResult.action}</span>
                <button onClick={() => setCodeActionResult(null)} className="text-gray-500 hover:text-gray-300"><X className="h-3 w-3" /></button>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-[#1e1e1e] p-2 font-mono text-[11px] text-[#d4d4d4]">{codeActionResult.result}</pre>
            </div>
          )}
          <AiChatPanel chat={chat} provider={activeProvider} model={activeModel} placeholder="Ask about this code..." compact
            suggestions={['Explain this file', 'Find bugs', 'Write tests', 'Refactor']} className="flex-1 bg-[#1e1e1e] [&_textarea]:!bg-[#333] [&_textarea]:!border-[#444] [&_textarea]:!text-white" />
        </div>
      )}

      {/* Preview panel */}
      {previewOpen && (
        <div className="flex w-80 shrink-0 flex-col border-l border-[#333] bg-[#252526] lg:w-[480px]">
          <div className="flex items-center justify-between border-b border-[#333] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300"><Globe className="h-3.5 w-3.5 text-sky-400" /> Preview</span>
            <div className="flex gap-1">
              <button onClick={refreshPreview} className="rounded p-1 text-gray-500 hover:text-gray-300" title="Refresh"><RefreshCw className="h-3 w-3" /></button>
              <button onClick={() => setPreviewOpen(false)} className="rounded p-1 text-gray-500 hover:text-gray-300"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-white">
            <iframe
              ref={previewRef}
              src={`${getApiOrigin() ?? ''}/v1/ai/workspace/${id}/preview/index.html`}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
            />
          </div>
        </div>
      )}

      {/* GitHub panel */}
      {githubPanelOpen && (
        <div className="flex w-72 shrink-0 flex-col border-l border-[#333] bg-[#252526] lg:w-80">
          <div className="flex items-center justify-between border-b border-[#333] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300"><GitBranch className="h-3.5 w-3.5 text-orange-400" /> GitHub</span>
            <button onClick={() => setGithubPanelOpen(false)} className="rounded p-1 text-gray-500 hover:text-gray-300"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {ghStatus?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-[#1e1e1e] p-3">
                  {ghStatus.avatarUrl && <img src={ghStatus.avatarUrl} className="h-8 w-8 rounded-full" alt="" />}
                  <div>
                    <p className="text-[12px] font-medium text-white">{ghStatus.username}</p>
                    <p className="text-[10px] text-emerald-400">Connected</p>
                  </div>
                </div>

                {(ws as any)?.githubRepoUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-[#1e1e1e] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Repository</p>
                      <p className="mt-1 truncate text-[12px] text-sky-400">{(ws as any).githubRepoUrl?.replace('https://github.com/', '')}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Branch: {(ws as any).githubBranch || 'main'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => { try { const r = await ghPush.mutateAsync(undefined); toast.success(r.message) } catch (e) { toast.error(e instanceof Error ? e.message : 'Push failed') } }}
                        disabled={ghPush.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {ghPush.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpFromLine className="h-3 w-3" />} Push
                      </button>
                      <button
                        onClick={async () => { try { await ghPull.mutateAsync(); toast.success('Pulled latest') } catch (e) { toast.error(e instanceof Error ? e.message : 'Pull failed') } }}
                        disabled={ghPull.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-[11px] font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                      >
                        {ghPull.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDownToLine className="h-3 w-3" />} Pull
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">Clone a repo to link it to this workspace. Use the terminal: <code className="text-gray-400">clone owner/repo</code></p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <GitBranch className="h-10 w-10 text-[#333]" />
                <p className="mt-3 text-[12px] text-gray-400">GitHub not connected</p>
                <p className="mt-1 text-[10px] text-gray-600">Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the API .env, then connect via OAuth.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO Research panel */}
      {researchOpen && !chatOpen && !previewOpen && !githubPanelOpen && (
        <div className="flex w-80 shrink-0 flex-col border-l border-[#333] bg-[#252526] lg:w-96">
          <div className="flex items-center justify-between border-b border-[#333] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300"><Search className="h-3.5 w-3.5 text-amber-400" /> SEO Research</span>
            <button onClick={() => setResearchOpen(false)} className="rounded p-1 text-gray-500 hover:text-gray-300"><X className="h-3.5 w-3.5" /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Search input */}
            <div className="border-b border-[#333] p-3">
              <textarea
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="e.g. Analyze competitors for 'link building services' and suggest content gaps..."
                rows={3}
                className="w-full rounded-lg border border-[#444] bg-[#1e1e1e] p-2 text-[12px] text-[#cccccc] outline-none placeholder:text-gray-600 focus:border-amber-500/50"
              />
              <button
                onClick={async () => {
                  if (!researchQuery.trim()) return
                  try {
                    const r = await researchMut.mutateAsync({ query: researchQuery.trim() })
                    setResearchResult(r)
                  } catch (e) { toast.error(e instanceof Error ? e.message : 'Research failed') }
                }}
                disabled={researchMut.isPending || !researchQuery.trim()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {researchMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                {researchMut.isPending ? 'Researching...' : 'Run SEO research'}
              </button>
              <p className="mt-2 text-[9px] text-gray-600">Uses SerpAPI, DataForSEO, and OpenPageRank APIs in the background.</p>
            </div>

            {/* Results */}
            {researchResult && (
              <div className="space-y-3 p-3">
                {/* Steps */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Research steps</p>
                  <div className="mt-1 space-y-1">
                    {researchResult.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className={s.success ? 'text-emerald-400' : 'text-red-400'}>{s.success ? '✓' : '✗'}</span>
                        <span className="rounded bg-[#333] px-1.5 py-0.5 text-[9px] font-medium text-amber-400">{s.tool}</span>
                        <span className="text-gray-400">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis */}
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Analysis</p>
                  <div className="mt-1 rounded-lg bg-[#1e1e1e] p-3">
                    <AiMarkdownView content={researchResult.analysis} showCopy={true} />
                  </div>
                </div>
              </div>
            )}

            {!researchResult && !researchMut.isPending && (
              <div className="flex flex-col items-center py-10 text-center">
                <Search className="h-8 w-8 text-[#333]" />
                <p className="mt-3 text-[12px] text-gray-400">SEO Research Agent</p>
                <p className="mt-1 max-w-[200px] text-[10px] text-gray-600">Ask to analyze competitors, find keyword gaps, check domain authority, or audit backlinks.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )

  if (ideMode) return ideShell
  return <PageTransition>{ideShell}</PageTransition>
}
