import { cn } from '@/utils/cn';

interface ToolPageIntroProps {
  /** Small label above the title (default: "Tool"). */
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  className?: string;
}

/**
 * Consistent hero copy for tool pages: what it does, why use it, and quick tips.
 */
export function ToolPageIntro({
  eyebrow = 'Tool',
  title,
  description,
  bullets,
  className,
}: ToolPageIntroProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200/90 bg-gradient-to-br from-gray-50/90 via-white to-primary-50/20 px-4 py-4 shadow-sm dark:border-gray-700/60 dark:from-gray-900/50 dark:via-gray-800/40 dark:to-primary-950/20 sm:px-5 sm:py-5',
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-400" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
