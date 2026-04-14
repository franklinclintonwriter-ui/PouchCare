import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function Toggle({ checked, onChange, label, disabled = false, size = 'md' }: ToggleProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2', disabled && 'cursor-not-allowed opacity-50')}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          checked
            ? 'bg-primary-600'
            : 'bg-gray-200 dark:bg-gray-600',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        )}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200',
            size === 'sm' ? 'h-4 w-4 translate-y-0.5' : 'h-5 w-5 translate-y-0.5',
            checked
              ? size === 'sm' ? 'translate-x-[18px]' : 'translate-x-[22px]'
              : 'translate-x-0.5',
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}

export { Toggle };
