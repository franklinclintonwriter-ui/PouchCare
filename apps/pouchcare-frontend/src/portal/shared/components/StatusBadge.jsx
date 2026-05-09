import { cn } from "../../../utils/cn";

const statusMap = {
  Active: "bg-emerald-100 text-emerald-700",
  Installed: "bg-emerald-100 text-emerald-700",
  Published: "bg-emerald-100 text-emerald-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Trial: "bg-sky-100 text-sky-700",
  Staging: "bg-sky-100 text-sky-700",
  Pending: "bg-amber-100 text-amber-700",
  Open: "bg-amber-100 text-amber-700",
  Invited: "bg-slate-100 text-slate-700",
  Draft: "bg-slate-100 text-slate-700",
  Resolved: "bg-blue-100 text-blue-700",
  Overdue: "bg-rose-100 text-rose-700",
  "Past Due": "bg-rose-100 text-rose-700",
  Disabled: "bg-rose-100 text-rose-700",
  Suspended: "bg-orange-100 text-orange-700",
  Paused: "bg-orange-100 text-orange-700",
  Optimized: "bg-emerald-100 text-emerald-700",
  Good: "bg-sky-100 text-sky-700",
  "Needs Work": "bg-amber-100 text-amber-700",
  Missing: "bg-rose-100 text-rose-700",
  Growth: "bg-violet-100 text-violet-700",
  Starter: "bg-sky-100 text-sky-700",
  Pro: "bg-emerald-100 text-emerald-700",
  Enterprise: "bg-indigo-100 text-indigo-700",
};

export default function StatusBadge({ value, className }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        statusMap[value] || "bg-slate-100 text-slate-700",
        className
      )}
    >
      {value}
    </span>
  );
}
