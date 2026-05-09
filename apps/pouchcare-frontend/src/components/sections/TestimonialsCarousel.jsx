import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import StarRating from "../ui/StarRating";

const testimonials = [
  {
    name: "Alex Morgan",
    role: "Lead Developer at CreativeStack",
    rating: 5,
    quote:
      "PouchCare completely transformed the way we build WordPress sites. What used to take weeks now takes days.",
    initials: "AM",
    gradient: "from-primary to-accent-cyan",
  },
  {
    name: "Sarah Chen",
    role: "UX Director at PixelForge",
    rating: 5,
    quote:
      "The design system alone is worth the investment. Our team's productivity has skyrocketed since switching to PouchCare.",
    initials: "SC",
    gradient: "from-accent-gold to-accent-orange",
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Designer",
    rating: 5,
    quote:
      "As a freelancer, PouchCare lets me deliver professional sites to clients in half the time. The templates are beautiful and the builder is incredibly intuitive.",
    initials: "MJ",
    gradient: "from-[#0E7C61] to-accent-cyan",
  },
  {
    name: "Emily Rodriguez",
    role: "CEO at LaunchPad Digital",
    rating: 4,
    quote:
      "We've built over 30 client sites with PouchCare. The consistency and quality we achieve is unmatched by any other toolkit.",
    initials: "ER",
    gradient: "from-[#D63031] to-accent-orange",
  },
  {
    name: "David Kim",
    role: "Agency Owner at KimCreative",
    rating: 5,
    quote:
      "The white-label feature is a game-changer for our agency. Clients love the results and we love the workflow.",
    initials: "DK",
    gradient: "from-primary-dark to-primary",
  },
  {
    name: "Lisa Thompson",
    role: "Product Manager at WebCraft",
    rating: 5,
    quote:
      "PouchCare's performance optimization is incredible. Our sites consistently score 95+ on PageSpeed Insights.",
    initials: "LT",
    gradient: "from-[#8B6914] to-accent-gold",
  },
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // How many visible at a time: 3 on lg, 1 otherwise (handled via CSS)
  const maxIndex = testimonials.length - 1;

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
            What Our Users Say
          </h2>
        </div>

        {/* Carousel viewport */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="w-full flex-shrink-0 px-3 lg:w-1/3"
              >
                <div className="bg-white rounded-card p-6 shadow-card border border-gray-100 h-full flex flex-col">
                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-primary/20 mb-3 flex-shrink-0" />

                  {/* Quote text */}
                  <p className="text-body leading-relaxed flex-1 mb-5">
                    "{t.quote}"
                  </p>

                  {/* Rating */}
                  <StarRating rating={t.rating} className="mb-4" />

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-heading text-sm">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "bg-primary w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
