import { cn } from "../../utils/cn";

export default function KpiGrid({ children, className }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
