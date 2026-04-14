import { cn } from '@/utils/cn';
import { Check, X, Clock, ArrowUpRight, Star, Send } from 'lucide-react';
import type { ApprovalStatus } from '@/types/enums';

interface ApprovalTimelineProps {
  currentStatus: ApprovalStatus;
  className?: string;
}

interface TimelineStep {
  label: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming' | 'error';
}

function getSteps(status: ApprovalStatus): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      label: 'Assigned',
      description: 'Task assigned to staff',
      icon: <Clock className="h-3.5 w-3.5" />,
      status: 'completed',
    },
    {
      label: 'Submitted',
      description: 'Staff submitted for review',
      icon: <Send className="h-3.5 w-3.5" />,
      status: statusGte(status, 'SUBMITTED') ? 'completed' : status === 'WAITING' ? 'current' : 'upcoming',
    },
  ];

  if (status === 'REJECTED_MGR') {
    steps.push({
      label: 'Rejected',
      description: 'Manager rejected — needs revision',
      icon: <X className="h-3.5 w-3.5" />,
      status: 'error',
    });
    return steps;
  }

  if (status === 'ESCALATED') {
    steps.push({
      label: 'Escalated',
      description: 'Escalated to CEO for review',
      icon: <ArrowUpRight className="h-3.5 w-3.5" />,
      status: 'current',
    });
    return steps;
  }

  steps.push({
    label: 'Manager Approved',
    description: 'Approved by manager',
    icon: <Check className="h-3.5 w-3.5" />,
    status: statusGte(status, 'APPROVED_MGR') ? 'completed' : status === 'SUBMITTED' ? 'current' : 'upcoming',
  });

  steps.push({
    label: 'Verified',
    description: 'CEO verified completion',
    icon: <Star className="h-3.5 w-3.5" />,
    status: status === 'VERIFIED' ? 'completed' : status === 'APPROVED_MGR' ? 'current' : 'upcoming',
  });

  return steps;
}

function statusGte(current: ApprovalStatus, target: ApprovalStatus): boolean {
  const order: ApprovalStatus[] = ['WAITING', 'SUBMITTED', 'APPROVED_MGR', 'VERIFIED'];
  return order.indexOf(current) >= order.indexOf(target);
}

function ApprovalTimeline({ currentStatus, className }: ApprovalTimelineProps) {
  const steps = getSteps(currentStatus);

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                step.status === 'completed' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                step.status === 'current' && 'bg-primary-100 text-primary-600 ring-2 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-800',
                step.status === 'upcoming' && 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
                step.status === 'error' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
              )}
            >
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-0.5 min-h-[20px] flex-1',
                  step.status === 'completed' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            )}
          </div>
          <div className="pb-4">
            <p className={cn(
              'text-sm font-medium',
              step.status === 'completed' && 'text-gray-900 dark:text-gray-100',
              step.status === 'current' && 'text-primary-700 dark:text-primary-400',
              step.status === 'upcoming' && 'text-gray-400 dark:text-gray-500',
              step.status === 'error' && 'text-red-600 dark:text-red-400',
            )}>
              {step.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { ApprovalTimeline };
