/**
 * Select — styled wrapper around the native `<select>`.
 *
 * Matches the shape + focus styling of `Input` so a `<FormField>` row with a
 * `<Select>` looks visually identical to one with an `<Input>`.
 *
 * Native under the hood — full keyboard + screen-reader support for free,
 * no portal, no positioning hacks. The downside (no per-option styling) is
 * acceptable for the client portal's needs.
 *
 * @example
 *   <Select {...register("method")}>
 *     <option value="">Pick a method</option>
 *     <option value="WALLET">Wallet</option>
 *     <option value="INVOICE">Invoice</option>
 *   </Select>
 */
import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  /** Render a single-value quick preset list instead of nesting <option> yourself. */
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Placeholder rendered as a disabled first option when `value` is "". */
  placeholder?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, error, options, placeholder, children, ...props },
    ref,
  ) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 shadow-sm transition-colors",
            "hover:border-gray-300",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600",
            error
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30"
              : "focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      </div>
    );
  },
);

Select.displayName = "Select";
