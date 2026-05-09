import { cn } from "../../utils/cn";

export default function SectionHeading({
  title,
  subtitle,
  centered = true,
  className,
}) {
  return (
    <div
      className={cn(
        "mb-12",
        centered && "text-center mx-auto max-w-2xl",
        className
      )}
    >
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body mt-4 text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
