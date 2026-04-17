import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

/** Primary brand mark — `public/pouchcare-logo.png` */
const LOGO_SRC = "/pouchcare-logo.png";

const variantClass = {
  /** Main header — scales with breakpoints */
  nav: "h-7 w-auto sm:h-8 md:h-9 lg:h-10 max-w-[min(100%,9rem)] sm:max-w-[10.5rem] md:max-w-[11.5rem] lg:max-w-[12.5rem]",
  /** Footer brand column — slightly larger */
  footer:
    "h-9 w-auto sm:h-10 md:h-11 max-w-[min(100%,11rem)] sm:max-w-[13rem] md:max-w-[14rem]",
  /** Mobile drawer */
  drawer: "h-8 w-auto max-w-[10rem] sm:max-w-[11rem]",
} as const;

export type BrandLogoVariant = keyof typeof variantClass;

type BrandLogoProps = {
  variant: BrandLogoVariant;
  to?: string;
  onClick?: () => void;
  className?: string;
  imgClassName?: string;
};

export function BrandLogo({
  variant,
  to = "/",
  onClick,
  className,
  imgClassName,
}: BrandLogoProps) {
  const img = (
    <img
      src={LOGO_SRC}
      alt="PouchCare"
      width={200}
      height={56}
      decoding="async"
      draggable={false}
      className={cn(
        "block object-contain object-left bg-transparent",
        "outline-none ring-0 border-0 shadow-none",
        variantClass[variant],
        imgClassName,
      )}
    />
  );

  const wrap = cn(
    "inline-flex items-center justify-start shrink-0 bg-transparent p-0 m-0 rounded-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 rounded-sm",
    className,
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        aria-label="PouchCare — Home"
        className={wrap}
      >
        {img}
      </Link>
    );
  }

  return <span className={wrap}>{img}</span>;
}
