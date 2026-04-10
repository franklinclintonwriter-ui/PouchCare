import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, DollarSign, Users, BarChart3, Clock } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useTasks } from '@/api/tasks';
import { useProject } from '@/api/projects';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs } from '@/components/ui/Tabs';
import { StatsRow } from '@/components/shared/StatsRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  const { data: project, isLoading } = useProject(id!);
  const { data: relatedTasks } = useTasks({ q: project?.name, limit: 10 });
  const [tab, setTab] = useState('overview');

  const headerConfig = useMemo(() => ({
    title: project?.name ?? 'Project',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: project?.name ?? '...' },
    ],
    actions: [],
  }), [project?.name]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!project) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Project not found
        </div>
      </PageTransition>
    );
  }

  const overviewStats = [
    { title: 'Budget', value: formatCurrency(project.budget), icon: <DollarSign />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { title: 'Spent', value: formatCurrency(project.spent), icon: <BarChart3 />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { title: 'Team Size', value: project.teamMembers.length, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { title: 'Progress', value: `${project.progress}%`, icon: <BarChart3 />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header card */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={project.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">{project.clientName}</span>
          </div>

          <ProgressBar value={project.progress} showLabel size="lg" className="mb-4" />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Start</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(project.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${project.budget.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Team</p>
                <div className="flex -space-x-1.5 mt-0.5">
                  {project.teamMembers.slice(0, 4).map(m => (
                    <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="xs" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Overview', value: 'overview' },
            { label: 'Tasks', value: 'tasks' },
            { label: 'Team', value: 'team' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'overview' && (
          <div className="space-y-6">
            <StatsRow items={overviewStats} />
            <Card>
              <CardContent className="mt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Description</p>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {project.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'tasks' && (
          <Card>
            <CardContent className="mt-0">
              {(relatedTasks?.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">No related tasks found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(relatedTasks?.data ?? []).map((t: any) => (
                    <div key={t.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'team' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.teamMembers.map(member => (
              <Card key={member.id} padding="sm">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatarUrl} size="md" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
