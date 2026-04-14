import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-primary-600 text-xs font-bold tracking-[0.15em] uppercase mb-3",
        className,
      )}
    >
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "font-sora font-bold text-gray-900 leading-tight tracking-tight",
        Tag === "h1"
          ? "text-4xl sm:text-5xl lg:text-6xl"
          : "text-2xl sm:text-3xl lg:text-4xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface SectionSubProps {
  children: ReactNode;
  className?: string;
}

export function SectionSub({ children, className }: SectionSubProps) {
  return (
    <p
      className={cn(
        "text-gray-600 leading-relaxed text-base sm:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}
