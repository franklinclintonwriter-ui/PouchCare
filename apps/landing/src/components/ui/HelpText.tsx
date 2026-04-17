/**
 * HelpText — small muted caption for field hints.
 *
 * Intentionally tiny so it can live under form fields, inside card footers,
 * or next to stat labels. The `info` variant prefixes an info icon; the
 * `warning` variant is amber-tinted for "heads-up" copy.
 *
 * @example
 *   <HelpText>We'll email you when your build completes.</HelpText>
 *   <HelpText variant="info">Takes 2–3 business days to process.</HelpText>
 *   <HelpText variant="warning">This action cannot be undone.</HelpText>
 */
import { type ReactNode } from "react";
import { Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface HelpTextProps {
  children: ReactNode;
  variant?: "muted" | "info" | "warning";
  className?: string;
  /** HTML id — useful when wiring via `aria-describedby` on a form control. */
  id?: string;
}

export function HelpText({
  children,
  variant = "muted",
  className,
  id,
}: HelpTextProps) {
  const Icon = variant === "info" ? Info : variant === "warning" ? AlertCircle : null;
  return (
    <p
      id={id}
      className={cn(
        "inline-flex items-start gap-1 text-xs",
        variant === "muted" && "text-gray-500 dark:text-gray-400",
        variant === "info" && "text-sky-700 dark:text-sky-300",
        variant === "warning" && "text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
