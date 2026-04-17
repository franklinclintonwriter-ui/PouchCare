import { cn } from "@/lib/cn";

type AvatarSize = "xs" | "sm" | "md";

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
};

const bgColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % bgColors.length;
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const safeName = (name ?? "").trim();
  const alt = safeName || "User";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-full object-cover ring-2 ring-white",
          sizeStyles[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-white",
        sizeStyles[size],
        bgColors[colorIndex(safeName || "user")],
        className,
      )}
      aria-hidden
    >
      {getInitials(safeName || "User")}
    </div>
  );
}
