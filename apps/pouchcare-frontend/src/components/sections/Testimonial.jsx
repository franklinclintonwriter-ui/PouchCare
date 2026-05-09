import { Star, Quote } from "lucide-react";
import { testimonials } from "../../data/testimonials";
import { useIntersection } from "../../hooks/useIntersection";

export default function Testimonial() {
  const [ref, isVisible] = useIntersection();
  const t = testimonials[0];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-container mx-auto px-6">
        <div
          ref={ref}
          className={`max-w-3xl mx-auto text-center ${
            isVisible ? "animate-fadeUp" : "opacity-0"
          }`}
        >
          {/* Quote icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Quote className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Quote text */}
          <blockquote className="font-heading text-xl md:text-2xl text-heading leading-relaxed font-medium italic">
            "{t.quote}"
          </blockquote>

          {/* Stars */}
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < t.rating
                    ? "fill-accent-gold text-accent-gold"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Avatar + name */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white font-heading font-bold text-lg">
              {t.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="text-left">
              <div className="font-heading font-semibold text-heading">
                {t.name}
              </div>
              <div className="text-sm text-body">{t.role}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
