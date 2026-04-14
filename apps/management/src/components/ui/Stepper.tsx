import { cn } from '@/utils/cn';
import { Check, Circle } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
}

interface StepperProps {
  steps: Step[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function Stepper({ steps, className, orientation = 'horizontal' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-0', className)}>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} />
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-0.5 flex-1 min-h-[24px]',
                  step.status === 'completed' ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700',
                )} />
              )}
            </div>
            <div className="pb-6">
              <p className={cn(
                'text-sm font-medium',
                step.status === 'current' ? 'text-primary-700 dark:text-primary-400' :
                step.status === 'completed' ? 'text-gray-900 dark:text-gray-100' :
                'text-gray-400 dark:text-gray-500',
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-1.5">
            <StepIcon status={step.status} />
            <span className={cn(
              'text-[11px] font-medium whitespace-nowrap',
              step.status === 'current' ? 'text-primary-700 dark:text-primary-400' :
              step.status === 'completed' ? 'text-gray-700 dark:text-gray-300' :
              'text-gray-400 dark:text-gray-500',
            )}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'mx-2 h-0.5 flex-1',
              step.status === 'completed' ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

function StepIcon({ status }: { status: Step['status'] }) {
  if (status === 'completed') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
        <Check className="h-3.5 w-3.5 text-white" />
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20">
        <Circle className="h-2 w-2 fill-primary-600 text-primary-600" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
        <span className="text-xs font-bold text-red-500">!</span>
      </div>
    );
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
      <Circle className="h-2 w-2 text-gray-300 dark:text-gray-600" />
    </div>
  );
}

export { Stepper, type Step };
