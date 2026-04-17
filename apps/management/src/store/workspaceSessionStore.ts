import { create } from 'zustand'

interface WorkspaceSession {
  workspaceId: string
  workspaceName: string
  conversationId: string | null
  startedAt: string
}

interface WorkspaceSessionState {
  activeSession: WorkspaceSession | null
  showLeaveDialog: boolean
  pendingNavigation: string | null

  startSession: (wsId: string, wsName: string, convId?: string | null) => void
  endSession: () => void
  continueInBackground: () => void
  setConversationId: (id: string) => void
  promptLeave: (to: string) => void
  cancelLeave: () => void
}

export const useWorkspaceSessionStore = create<WorkspaceSessionState>((set) => ({
  activeSession: null,
  showLeaveDialog: false,
  pendingNavigation: null,

  startSession: (workspaceId, workspaceName, conversationId) =>
    set({
      activeSession: {
        workspaceId,
        workspaceName,
        conversationId: conversationId ?? null,
        startedAt: new Date().toISOString(),
      },
    }),

  endSession: () =>
    set({ activeSession: null, showLeaveDialog: false, pendingNavigation: null }),

  continueInBackground: () =>
    set({ showLeaveDialog: false }),

  setConversationId: (id) =>
    set((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, conversationId: id } : null,
    })),

  promptLeave: (to) =>
    set({ showLeaveDialog: true, pendingNavigation: to }),

  cancelLeave: () =>
    set({ showLeaveDialog: false, pendingNavigation: null }),
}))
