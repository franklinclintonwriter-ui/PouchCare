import { cn } from "@/lib/cn";

export function UsageMeterBar({
  used,
  limit,
  unit = "GB",
}: {
  used: number;
  limit: number;
  unit?: string;
}) {
  const p = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>
          {used} / {limit} {unit}
        </span>
        <span>{p}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            p > 90 ? "bg-amber-500" : "bg-primary-500",
          )}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}
