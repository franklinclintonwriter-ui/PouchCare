import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { timeAgo } from '@/lib/utils'
import api from '@/lib/api'

interface Props { taskId: string }

export function TaskComments({ taskId }: Props) {
  const [text, setText] = useState('')
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => api.get(`/tasks/${taskId}/comments`).then(r => r.data.data).catch(() => []),
  })

  const addComment = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-comments', taskId] }); setText('') },
  })

  return (
    <div className="border-t border-midnight-border pt-4 mt-4">
      <h4 className="font-sora font-semibold text-sm mb-3">💬 Comments</h4>
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {(data || []).length === 0
          ? <p className="text-text-muted text-xs">No comments yet.</p>
          : (data || []).map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-sky-400">
                {c.authorId === user?.id ? 'You' : '?'}
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-0.5">{timeAgo(c.createdAt)}</p>
                <p className="text-sm text-text-secondary bg-midnight-hover rounded-lg px-3 py-2">{c.content}</p>
              </div>
            </div>
          ))
        }
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && text.trim() && addComment.mutate(text)}
          placeholder="Write a comment... (Enter to send)"
          className="flex-1 bg-[#0d1528] border border-midnight-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-sky-500 placeholder:text-text-muted"
        />
        <Button size="sm" onClick={() => text.trim() && addComment.mutate(text)} loading={addComment.isPending}>
          Send
        </Button>
      </div>
    </div>
  )
}
