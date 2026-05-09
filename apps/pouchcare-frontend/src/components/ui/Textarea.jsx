import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-btn border border-gray-200 bg-white",
        "px-4 py-2.5 text-sm text-heading placeholder:text-body/50",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        className
      )}
      {...props}
    />
  );
});

export default Textarea;
