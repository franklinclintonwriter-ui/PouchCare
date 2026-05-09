import { cn } from "../../utils/cn";

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name = "", src, size = "md", className }) {
  return (
    <div
      className={cn(
        "rounded-full border-2 border-white shadow shrink-0 overflow-hidden",
        "flex items-center justify-center font-semibold text-white",
        "bg-gradient-to-br from-primary to-accent-cyan",
        sizeStyles[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
