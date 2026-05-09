import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md",
  secondary:
    "border-2 border-primary text-primary bg-transparent hover:bg-primary/5",
  ghost: "text-primary hover:underline underline-offset-4",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-2.5 text-base gap-2",
  lg: "px-8 py-3.5 text-lg gap-2.5",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    children,
    icon: Icon,
    iconPosition = "left",
    className,
    as: Component = "button",
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-btn font-semibold",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === "right" && <Icon className="w-4 h-4 shrink-0" />}
    </Component>
  );
});

export default Button;
