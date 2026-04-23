import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const iconBg = {
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" overlayClassName="no-print">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <div className={cn('rounded-full p-3', iconBg[variant])}>
          {variant === 'info' ? (
            <Info className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="mt-3 sm:ml-4 sm:mt-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export { ConfirmDialog };
