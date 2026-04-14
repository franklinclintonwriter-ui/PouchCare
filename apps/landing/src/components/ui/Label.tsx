import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  className,
  children,
  required,
  ...props
}: LabelProps) {
  return (
    <label className={cn(ui.label, className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
