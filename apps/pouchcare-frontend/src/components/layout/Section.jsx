import { cn } from "../../utils/cn";

const bgStyles = {
  white: "bg-white",
  light: "bg-surface-light",
  blue: "bg-primary/5",
};

export default function Section({ children, className, bg = "white" }) {
  return (
    <section className={cn("py-20", bgStyles[bg], className)}>
      {children}
    </section>
  );
}
