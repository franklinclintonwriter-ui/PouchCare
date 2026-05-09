import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-btn border border-gray-200 bg-white",
        "px-3 py-2.5 text-sm text-heading",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
