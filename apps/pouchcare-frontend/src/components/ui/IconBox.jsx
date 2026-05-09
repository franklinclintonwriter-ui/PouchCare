import { cn } from "../../utils/cn";

export default function IconBox({ children, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-3 bg-primary/10 text-primary",
        className
      )}
    >
      {children}
    </div>
  );
}
