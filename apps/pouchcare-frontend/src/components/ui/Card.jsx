import { cn } from "../../utils/cn";

export default function Card({ children, className, hover = true }) {
  return (
    <div
      className={cn(
        "bg-white rounded-card shadow-card border border-gray-100 overflow-hidden",
        "transition-all duration-300 ease-out",
        hover && [
          "hover:shadow-card-hover hover:-translate-y-1",
          "hover:border-t-[3px] hover:border-t-primary",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
