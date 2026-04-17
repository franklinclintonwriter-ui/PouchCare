/**
 * Toggle — accessible on/off switch.
 *
 * Uses a native `<button role="switch">` pattern with `aria-checked` so screen
 * readers announce the state correctly. Replaces the hand-rolled `ToggleRow`
 * component previously scoped to SettingsPage.
 *
 * @example
 *   <Toggle checked={value} onChange={setValue} label="Email notifications" />
 *   <Toggle
 *     checked={value}
 *     onChange={setValue}
 *     label="SMS alerts"
 *     description="Receive critical alerts by SMS"
 *   />
 */
import { forwardRef, type ReactNode, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label rendered next to the switch. */
  label?: ReactNode;
  /** Secondary caption rendered below the label. */
  description?: ReactNode;
  /** Position of the label relative to the switch. Default `left` (label
   *  first, switch on the right). */
  labelPosition?: "left" | "right";
  disabled?: boolean;
  /** Override aria-label when no visible label is rendered (icon-only). */
  ariaLabel?: string;
  className?: string;
  /** Size of the switch track. Default `md`. */
  size?: "sm" | "md";
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onChange,
      label,
      description,
      labelPosition = "left",
      disabled,
      ariaLabel,
      className,
      size = "md",
    },
    ref,
  ) => {
    const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!disabled) onChange(!checked);
      }
    };

    const track = cn(
      "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2",
      "dark:focus-visible:ring-offset-gray-900",
      size === "sm" ? "h-5 w-9" : "h-6 w-11",
      checked
        ? "bg-primary-500"
        : "bg-gray-300 dark:bg-gray-700",
      disabled && "cursor-not-allowed opacity-50",
    );
    const thumb = cn(
      "pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition-transform",
      size === "sm" ? "h-4 w-4" : "h-5 w-5",
      checked
        ? size === "sm"
          ? "translate-x-4"
          : "translate-x-5"
        : "translate-x-0",
    );

    const switchEl = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKey}
        className={track}
      >
        <span className={thumb} />
      </button>
    );

    if (!label && !description) {
      return <div className={className}>{switchEl}</div>;
    }

    return (
      <div
        className={cn(
          "flex items-start gap-3",
          labelPosition === "right" && "flex-row-reverse justify-end",
          className,
        )}
      >
        {switchEl}
        <div className={cn("flex-1 text-sm", disabled && "opacity-70")}>
          {label && (
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {label}
            </div>
          )}
          {description && (
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </div>
          )}
        </div>
      </div>
    );
  },
);

Toggle.displayName = "Toggle";
