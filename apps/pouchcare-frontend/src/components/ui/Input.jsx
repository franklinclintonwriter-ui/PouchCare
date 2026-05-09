import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Input = forwardRef(function Input(
  { icon: Icon, className, ...props },
  ref
) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body pointer-events-none" />
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-btn border border-gray-200 bg-white",
          "px-4 py-2.5 text-sm text-heading placeholder:text-body/50",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          Icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
});

export default Input;
