import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

export default function StarRating({ rating = 0, className }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4",
            i < rating
              ? "fill-accent-gold text-accent-gold"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}
