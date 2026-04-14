import { cn } from "@/lib/cn";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-primary-200 border-t-primary-600",
          sizes[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
