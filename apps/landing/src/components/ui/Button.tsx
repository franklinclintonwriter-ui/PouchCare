import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'sky';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-glow-sky hover:from-sky-400 hover:to-sky-500 hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0',
  sky:
    'bg-sky-500 text-white hover:bg-sky-400 hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/70 hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-slate-400 hover:text-slate-100 hover:bg-white/5',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
  xl: 'px-8 py-3.5 text-base rounded-xl gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, iconRight, fullWidth, className, children, as: Tag = 'button', href, target, rel, ...props }, ref) => {
    const cls = cn(
      'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className,
    );

    if (Tag === 'a' && href) {
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
  }
);

Button.displayName = 'Button';
export { Button };
