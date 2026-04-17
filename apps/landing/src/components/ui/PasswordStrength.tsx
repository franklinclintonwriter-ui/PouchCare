/**
 * PasswordStrength — visual strength meter + checklist of requirements.
 *
 * Used by RegisterPage, ResetPasswordPage, and SettingsPage password change.
 * Promoted from the inline implementation previously scoped to SettingsPage.
 *
 * Design:
 *   - Shows the requirements list up front so users know what's needed
 *     before typing (addresses audit §P1 "show requirements upfront").
 *   - Rates 0–4 across five heuristics: length, mix of case, digits, symbols,
 *     and length-over-12. Scoring is deliberately lightweight — no zxcvbn
 *     dependency to keep the bundle small.
 *
 * @example
 *   <PasswordStrength value={password} />
 */
import { useMemo, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PasswordStrengthProps {
  value: string;
  /** Override the minimum length (default 8). */
  minLength?: number;
  /** Hide the checklist and only show the bar + verdict. */
  barOnly?: boolean;
  className?: string;
}

export interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4;
  verdict: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  checks: Array<{ met: boolean; label: string }>;
}

export function scorePassword(value: string, minLength = 8): PasswordScore {
  const v = value ?? "";
  const checks = [
    { met: v.length >= minLength, label: `At least ${minLength} characters` },
    { met: /[a-z]/.test(v) && /[A-Z]/.test(v), label: "Upper & lower case" },
    { met: /\d/.test(v), label: "A number" },
    { met: /[^A-Za-z0-9]/.test(v), label: "A symbol (!@#…)" },
    { met: v.length >= 12, label: "12+ chars for extra strength" },
  ];
  const metCount = checks.filter((c) => c.met).length;
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let verdict: PasswordScore["verdict"] = "Too short";
  if (v.length === 0) {
    score = 0;
    verdict = "Too short";
  } else if (!checks[0].met) {
    score = 0;
    verdict = "Too short";
  } else if (metCount <= 2) {
    score = 1;
    verdict = "Weak";
  } else if (metCount === 3) {
    score = 2;
    verdict = "Fair";
  } else if (metCount === 4) {
    score = 3;
    verdict = "Good";
  } else {
    score = 4;
    verdict = "Strong";
  }
  return { score, verdict, checks };
}

const BAR_COLORS = [
  "bg-gray-200 dark:bg-gray-700",
  "bg-red-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-emerald-500",
];

const VERDICT_COLORS: Record<PasswordScore["verdict"], string> = {
  "Too short": "text-gray-500 dark:text-gray-400",
  Weak: "text-red-600 dark:text-red-400",
  Fair: "text-amber-600 dark:text-amber-400",
  Good: "text-sky-700 dark:text-sky-300",
  Strong: "text-emerald-700 dark:text-emerald-300",
};

export function PasswordStrength({
  value,
  minLength = 8,
  barOnly = false,
  className,
}: PasswordStrengthProps): ReactNode {
  const { score, verdict, checks } = useMemo(
    () => scorePassword(value, minLength),
    [value, minLength],
  );

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div className="flex items-center gap-2">
        <div
          className="flex h-1.5 flex-1 gap-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={score}
          aria-label={`Password strength: ${verdict}`}
        >
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-full flex-1 rounded-full transition-colors",
                score >= i ? BAR_COLORS[score] : BAR_COLORS[0],
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium", VERDICT_COLORS[verdict])}>
          {verdict}
        </span>
      </div>
      {!barOnly && (
        <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className={cn(
                "inline-flex items-center gap-1.5",
                c.met
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {c.met ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <X className="h-3.5 w-3.5" aria-hidden />
              )}
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
