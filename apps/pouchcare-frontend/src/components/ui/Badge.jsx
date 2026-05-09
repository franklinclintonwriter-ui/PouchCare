import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  default: "bg-gray-100 text-gray-600",
};

export default function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full text-xs font-medium px-3 py-1",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
