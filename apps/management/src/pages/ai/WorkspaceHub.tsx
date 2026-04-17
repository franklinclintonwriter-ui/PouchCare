import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace, useIntegrations, useConnectIntegration, useDisconnectIntegration } from '@/api/workspace'
import { useWorkspaceSessionStore } from '@/store/workspaceSessionStore'
import {
  FolderCode, Plus, Trash2, ArrowUpRight, Clock, FileText, Terminal, X as XIcon,
  Plug, Check, ExternalLink, GitBranch, Cloud, FileSearch,
  Key,
} from 'lucide-react'
import { toast } from 'sonner'

const ICON_MAP: Record<string, React.ReactNode> = {
  github: <GitBranch className="h-5 w-5" />,
  cloud: <Cloud className="h-5 w-5" />,
  'file-text': <FileSearch className="h-5 w-5" />,
}

export default function WorkspaceHub() {
  const navigate = useNavigate()
  const { data: workspaces, isLoading } = useWorkspaces()
  const { data: integrations } = useIntegrations()
  const createWs = useCreateWorkspace()
  const deleteWs = useDeleteWorkspace()
  const connectInt = useConnectIntegration()
  const disconnectInt = useDisconnectIntegration()
  const [createOpen, setCreateOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const { activeSession, endSession } = useWorkspaceSessionStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return toast.error('Name is required')
    try {
      const ws = await createWs.mutateAsync({ name: name.trim(), description: desc.trim() || undefined })
      toast.success('Workspace created')
      setCreateOpen(false); setName(''); setDesc('')
      navigate(`/ai/workspace/${ws.id}`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }, [name, desc, createWs, navigate])

  const handleConnect = useCallback(async () => {
    if (!connectOpen || !tokenInput.trim()) return
    try {
      await connectInt.mutateAsync({ provider: connectOpen, token: tokenInput.trim(), displayName: nameInput.trim() || undefined })
      toast.success('Connected')
      setConnectOpen(null); setTokenInput(''); setNameInput('')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }, [connectOpen, tokenInput, nameInput, connectInt])

  const connectedCount = integrations?.filter((i) => i.connected).length ?? 0

  const headerConfig = useMemo(() => ({
    title: 'Workspaces',
    description: `${workspaces?.length ?? 0} projects, ${connectedCount} integrations`,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Workspaces' }],
    actions: [
      { type: 'button' as const, label: 'New workspace', icon: Plus, variant: 'primary' as const, onClick: () => setCreateOpen(true) },
    ],
  }), [workspaces?.length, connectedCount])

  useHeaderConfig(headerConfig)

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        {/* Active session banner */}
        {activeSession && (
          <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 px-4 py-3 dark:border-cyan-800/40 dark:from-cyan-950/30 dark:to-violet-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
                <Terminal className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Active session: <span className="text-cyan-700 dark:text-cyan-300">{activeSession.workspaceName}</span>
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Chat widget is connected to this workspace</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" /> RUNNING
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/ai/workspace/${activeSession.workspaceId}`)} className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300">
                Resume
              </button>
              <button onClick={endSession} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30" title="End session">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-cyan-50/60 via-white to-violet-50/30 px-6 py-6 shadow-sm dark:border-gray-700/60 dark:from-cyan-950/20 dark:via-gray-900/50 dark:to-violet-950/15">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-500 to-violet-500" aria-hidden />
          <div className="flex items-center gap-4 pl-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg">
              <FolderCode className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Workspaces</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Code editor with AI copilot, terminal, GitHub, and deploy integrations.</p>
            </div>
          </div>
        </div>

        {/* Integrations */}
        {integrations && integrations.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-primary-100 dark:from-violet-900/30 dark:to-primary-900/30">
                  <Plug className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Connected services</h2>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{connectedCount} of {integrations.length} active</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {integrations.map((int) => (
                <div key={int.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  {/* Icon */}
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: int.color + '12', color: int.color, border: `1px solid ${int.color}25` }}>
                      {ICON_MAP[int.icon] ?? <Plug className="h-5 w-5" />}
                    </div>
                    {int.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-900">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{int.name}</span>
                      {int.connected && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          CONNECTED
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{int.description}</p>
                    {int.connected && int.displayName && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        {int.avatarUrl && <img src={int.avatarUrl} className="h-3.5 w-3.5 rounded-full" alt="" />}
                        {int.displayName}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {int.connected ? (
                      <button
                        onClick={async () => {
                          if (!confirm(`Disconnect ${int.name}?`)) return
                          try { await disconnectInt.mutateAsync(int.id); toast.success('Disconnected') } catch { toast.error('Failed') }
                        }}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Disconnect
                      </button>
                    ) : int.configured ? (
                      <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Via .env
                      </span>
                    ) : (
                      <button
                        onClick={() => { setConnectOpen(int.id); setTokenInput(''); setNameInput('') }}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:bg-primary-950/30 dark:hover:text-primary-400"
                      >
                        <Key className="h-3 w-3" /> Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspaces grid */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
            <Button size="sm" variant="ghost" onClick={() => setCreateOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>New</Button>
          </div>

          {isLoading ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
              ))}
            </div>
          ) : !workspaces?.length ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
              <FolderCode className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No workspaces yet</p>
              <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">Create a workspace to start coding with AI copilot.</p>
              <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>Create workspace</Button>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <Card key={ws.id} className="group cursor-pointer transition-all hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700" onClick={() => navigate(`/ai/workspace/${ws.id}`)}>
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <FolderCode className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm(`Delete "${ws.name}"?`)) return
                            try { await deleteWs.mutateAsync(ws.id); toast.success('Deleted') } catch { toast.error('Failed') }
                          }}
                          className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:text-cyan-500 dark:text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 dark:text-gray-50 dark:group-hover:text-cyan-400">{ws.name}</h3>
                      {ws.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{ws.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {ws._count.files} files</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ws.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create workspace modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New workspace" size="sm"
        footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button isLoading={createWs.isPending} onClick={handleCreate}>Create</Button></>}>
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Landing page redesign" />
          <Input label="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief purpose or notes" />
        </div>
      </Modal>

      {/* Connect integration modal */}
      <Modal isOpen={Boolean(connectOpen)} onClose={() => setConnectOpen(null)} title={`Connect ${integrations?.find((i) => i.id === connectOpen)?.name ?? ''}`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setConnectOpen(null)}>Cancel</Button><Button isLoading={connectInt.isPending} onClick={handleConnect} disabled={!tokenInput.trim()}>Connect</Button></>}>
        {(() => {
          const provider = integrations?.find((i) => i.id === connectOpen)
          const tokenHints: Record<string, { label: string; placeholder: string; steps: string[] }> = {
            github: {
              label: 'Personal Access Token (PAT)',
              placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
              steps: ['Go to GitHub Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens', 'Click "Generate new token"', 'Select scopes: repo, read:user', 'Copy the token and paste it below'],
            },
            notion: {
              label: 'Internal Integration Token',
              placeholder: 'ntn_xxxxxxxxxxxxxxxxxxxx',
              steps: ['Go to notion.so/my-integrations', 'Click "New integration"', 'Name it (e.g. PouchCare)', 'Copy the "Internal Integration Secret"'],
            },
          }
          const hint = connectOpen ? tokenHints[connectOpen] : null
          return (
            <div className="space-y-4">
              {hint && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">How to get your token</p>
                  <ol className="mt-2 space-y-1.5">
                    {hint.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <Input
                label={hint?.label ?? 'API Token / Access Key'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={hint?.placeholder ?? 'Paste your API token here'}
              />
              <Input label="Display name (optional)" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. My project" />
              {provider?.docsUrl && (
                <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400">
                  <ExternalLink className="h-3 w-3" /> Open {provider.name} dashboard
                </a>
              )}
            </div>
          )
        })()}
      </Modal>
    </PageTransition>
  )
}
