import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400",
          "hover:border-gray-300",
          error
            ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30"
            : "focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
