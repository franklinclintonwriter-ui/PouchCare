import {
  PenTool,
  FileSearch,
  MessageSquare,
  ListChecks,
  FileText,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import type { AiUseCase } from './types'

export interface AiToolDefinition {
  id: string
  path: string
  title: string
  description: string
  icon: LucideIcon
  useCase: AiUseCase
  accent: string
}

export const AI_TOOLS_REGISTRY: AiToolDefinition[] = [
  {
    id: 'chat',
    path: '/ai/chat',
    title: 'AI Chat',
    description: 'General-purpose assistant for work questions and planning.',
    icon: MessageSquare,
    useCase: 'CHAT',
    accent: 'sky',
  },
  {
    id: 'blog',
    path: '/ai/blog',
    title: 'Blog Writer',
    description: 'Generate SEO-optimized articles from a topic and keywords.',
    icon: PenTool,
    useCase: 'BLOG',
    accent: 'emerald',
  },
  {
    id: 'seo-brief',
    path: '/ai/seo-brief',
    title: 'SEO Brief',
    description: 'Structured content brief with heading outline and meta tags.',
    icon: FileSearch,
    useCase: 'SEO_BRIEF',
    accent: 'violet',
  },
  {
    id: 'task-planner',
    path: '/ai/task-planner',
    title: 'Task Planner',
    description: 'Break any task into actionable subtasks with time estimates.',
    icon: ListChecks,
    useCase: 'TASK',
    accent: 'amber',
  },
  {
    id: 'report',
    path: '/ai/report',
    title: 'Report Drafter',
    description: 'Auto-draft daily reports from your task activity.',
    icon: FileText,
    useCase: 'REPORT',
    accent: 'rose',
  },
  {
    id: 'usage',
    path: '/ai/usage',
    title: 'Usage & Budget',
    description: 'Monitor token consumption and provider breakdown.',
    icon: BarChart3,
    useCase: 'CHAT',
    accent: 'slate',
  },
]
