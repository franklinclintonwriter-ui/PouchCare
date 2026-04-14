import type { ReactNode } from "react";
import { Check, Server } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface HostingPlanEntry {
  id: string;
  name: string;
  blurb: string;
  monthlyUsd: number;
  features: string[];
}

type Props = {
  plan: HostingPlanEntry;
  index: number;
  /** Register page: mock select. Marketing: omit for Link-based CTAs */
  onSelectPlan?: (plan: HostingPlanEntry) => void;
  /** When set, primary button is replaced by this node (e.g. Link) */
  footerSlot?: ReactNode;
  className?: string;
  /** Use `div` instead of `li` when not inside a `<ul>` (e.g. marketing grid). */
  asListItem?: boolean;
};

export function HostingPlanCard({
  plan,
  index,
  onSelectPlan,
  footerSlot,
  className,
  asListItem = true,
}: Props) {
  const popular = index === 1;
  const shellClass = cn(
    "flex h-full flex-col rounded-2xl border p-5 sm:p-6",
    popular
      ? "border-primary-300 bg-gradient-to-b from-primary-50/80 to-white shadow-md ring-2 ring-primary-200/50"
      : "border-gray-200 bg-white shadow-sm",
    className,
  );

  const body = (
    <>
      {popular && (
        <span className="mb-2 inline-flex w-fit rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-primary-600" aria-hidden />
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
        {plan.blurb}
      </p>
      <p className="mt-4 text-3xl font-bold tabular-nums text-gray-900">
        {formatUsd(plan.monthlyUsd)}
        <span className="text-base font-normal text-gray-500"> /mo</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              aria-hidden
            />
            {f}
          </li>
        ))}
      </ul>
      {footerSlot ?? (
        <Button
          type="button"
          variant={popular ? "primary" : "outline"}
          className="mt-6 w-full min-h-[44px] sm:min-h-0"
          onClick={() => onSelectPlan?.(plan)}
        >
          Select plan
        </Button>
      )}
    </>
  );

  if (asListItem) {
    return <li className={shellClass}>{body}</li>;
  }
  return <div className={shellClass}>{body}</div>;
}
