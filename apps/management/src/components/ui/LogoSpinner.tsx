import { cn } from "@/utils/cn";

const sizes = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
} as const;

interface LogoSpinnerProps {
  size?: keyof typeof sizes;
  label?: string;
  showText?: boolean;
  className?: string;
}

export function LogoSpinner({
  size = "md",
  label = "Loading…",
  showText = true,
  className,
}: LogoSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <div className="relative">
        {/* Spinning glow ring */}
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-primary-200/40 border-t-primary-500",
            sizes[size],
          )}
        />
        {/* Logo icon centered */}
        <img
          src="/pouchcare-logo-nobg.png"
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 m-auto bg-transparent object-contain",
            size === "sm" && "h-5 w-5",
            size === "md" && "h-8 w-8",
            size === "lg" && "h-11 w-11",
          )}
        />
      </div>
      {showText && (
        <span className="animate-pulse text-sm font-medium text-gray-400">
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
