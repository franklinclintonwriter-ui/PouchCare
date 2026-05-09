import { cn } from "../../utils/cn";

const sizes = {
  sm: { svg: 28, text: "text-base" },
  md: { svg: 36, text: "text-xl" },
  lg: { svg: 48, text: "text-2xl" },
};

export default function Logo({ size = "md", showText = true, light = false }) {
  const { svg, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <svg
        width={svg}
        height={svg}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PouchCare logo"
      >
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0A7AFF" />
            <stop offset="100%" stopColor="#0062D6" />
          </linearGradient>
        </defs>
        {/* Rounded rect background */}
        <rect width="48" height="48" rx="12" fill="url(#logoBg)" />
        {/* P letter */}
        <path
          d="M12 36V12h7c4.42 0 7 2.58 7 6s-2.58 6-7 6h-3v12h-4z"
          fill="white"
          opacity="0.95"
        />
        {/* C letter */}
        <path
          d="M38 20c-1-3.5-4-6-8-6-5 0-9 4-9 9s4 9 9 9c4 0 7-2.5 8-6h-4.5c-.8 1.8-2.5 3-4.5 3-3.3 0-5-2.7-5-6s1.7-6 5-6c2 0 3.7 1.2 4.5 3H38z"
          fill="white"
          opacity="0.95"
        />
        {/* Circuit lines */}
        <line x1="8" y1="42" x2="18" y2="42" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="18" y1="42" x2="18" y2="38" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="30" y1="42" x2="40" y2="42" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="35" y1="42" x2="35" y2="38" stroke="white" strokeWidth="1.5" opacity="0.4" />
        {/* Gold dot */}
        <circle cx="18" cy="38" r="2.5" fill="#FFB800" />
      </svg>

      {showText && (
        <span
          className={cn(
            "font-heading font-bold tracking-tight",
            text,
            light ? "text-white" : "text-heading"
          )}
        >
          PouchCare
        </span>
      )}
    </div>
  );
}
