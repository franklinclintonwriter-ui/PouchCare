/**
 * CopyButton — compact "copy to clipboard" button with built-in
 * "Copied!" feedback + automatic reset.
 *
 * Used on Referrals (referral link), Profile (portal URL), Settings (API key),
 * Hosting (domain name), plus anywhere else a short string is worth copying.
 *
 * Falls back to a hidden-textarea + document.execCommand path for browsers
 * without the async clipboard API (older Safari / WebView).
 */
import { forwardRef, useState, useCallback, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CopyButtonProps {
  /** The string placed on the clipboard when the button is clicked. */
  value: string;
  /** Override the default child (icon + label). */
  children?: ReactNode;
  /** Custom label shown next to the icon. Default: "Copy". */
  label?: string;
  /** Label shown for `feedbackMs` after a successful copy. Default: "Copied!". */
  copiedLabel?: string;
  /** Milliseconds the "Copied!" state stays visible. Default 1800 ms. */
  feedbackMs?: number;
  /** Fires after the clipboard write resolves successfully. */
  onCopied?: () => void;
  /** Compact mode — icon-only, square button. */
  iconOnly?: boolean;
  className?: string;
  /** HTML title attribute; defaults to the label. */
  title?: string;
  /** Optional aria-label override for icon-only variants. */
  ariaLabel?: string;
  disabled?: boolean;
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  // Legacy fallback: hidden textarea + execCommand.
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      children,
      label = "Copy",
      copiedLabel = "Copied!",
      feedbackMs = 1800,
      onCopied,
      iconOnly = false,
      className,
      title,
      ariaLabel,
      disabled,
    },
    ref,
  ) => {
    const [copied, setCopied] = useState(false);
    const [errored, setErrored] = useState(false);

    const handleClick = useCallback(async () => {
      const ok = await copyToClipboard(value);
      if (!ok) {
        setErrored(true);
        window.setTimeout(() => setErrored(false), feedbackMs);
        return;
      }
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), feedbackMs);
    }, [value, feedbackMs, onCopied]);

    const displayLabel = errored
      ? "Copy failed — select the text"
      : copied
        ? copiedLabel
        : label;

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={title ?? displayLabel}
        aria-label={ariaLabel ?? (iconOnly ? displayLabel : undefined)}
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors",
          "hover:border-primary-300 hover:text-primary-700",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:text-primary-300",
          copied &&
            "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
          errored &&
            "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300",
          disabled && "opacity-50 cursor-not-allowed",
          iconOnly && "h-8 w-8 px-0 justify-center",
          className,
        )}
      >
        {children ?? (
          <>
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {!iconOnly && <span>{displayLabel}</span>}
          </>
        )}
      </button>
    );
  },
);
CopyButton.displayName = "CopyButton";
