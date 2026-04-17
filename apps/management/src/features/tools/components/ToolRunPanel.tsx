import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Play, Trash2 } from 'lucide-react';

interface ToolRunPanelProps {
  children: ReactNode;
  onRun: () => void;
  onClear?: () => void;
  onExportCsv?: () => void;
  /** When false, only the form area is shown (actions live in the app header). */
  showActions?: boolean;
  runLabel?: string;
  running?: boolean;
  disabled?: boolean;
  exportDisabled?: boolean;
  className?: string;
}

export function ToolRunPanel({
  children,
  onRun,
  onClear,
  onExportCsv,
  showActions = true,
  runLabel = 'Run',
  running = false,
  disabled = false,
  exportDisabled = true,
  className = '',
}: ToolRunPanelProps) {
  return (
    <div className={`rounded-xl border border-gray-200/80 bg-white p-4 shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80 sm:p-5 ${className}`}>
      <div className={showActions ? 'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between' : 'flex flex-col gap-4'}>
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        {showActions ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {onExportCsv && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onExportCsv}
                disabled={exportDisabled}
                className="min-h-[44px] sm:min-h-0"
                icon={<Download />}
              >
                Export CSV
              </Button>
            )}
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="min-h-[44px] sm:min-h-0"
                icon={<Trash2 />}
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onRun}
              disabled={disabled || running}
              isLoading={running}
              icon={!running ? <Play /> : undefined}
              className="min-h-[44px] min-w-[120px] sm:min-h-0"
            >
              {runLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
