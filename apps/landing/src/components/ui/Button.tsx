import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "sky" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft hover:from-primary-700 hover:to-primary-600 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0",
  danger:
    "bg-red-600 text-white shadow-soft hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 focus-visible:ring-red-500/50",
  sky: "bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 hover:-translate-y-0.5 active:translate-y-0 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-primary-950/40 dark:hover:border-primary-700 dark:hover:text-primary-300",
  ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
  xl: "px-8 py-3.5 text-base rounded-xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      fullWidth,
      className,
      children,
      as: Tag = "button",
      href,
      target,
      rel,
      ...props
    },
    ref,
  ) => {
    const cls = cn(
      "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
      "focus-visible:ring-primary-500/50",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && "w-full",
      className,
    );

    if (Tag === "a" && href) {
      return (
        <a href={href} target={target} rel={rel} className={cls}>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </a>
      );
    }

    return (
      <button ref={ref} className={cls} {...props}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };
