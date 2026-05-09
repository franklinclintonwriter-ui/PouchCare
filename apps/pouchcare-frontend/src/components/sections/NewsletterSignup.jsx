import { Send } from "lucide-react";
import { useIntersection } from "../../hooks/useIntersection";

export default function NewsletterSignup() {
  const [ref, isVisible] = useIntersection();

  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark py-16">
      <div
        ref={ref}
        className={`max-w-container mx-auto px-6 ${
          isVisible ? "animate-fadeUp" : "opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left side — text */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              Stay in the Loop
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-lg">
              Get the latest updates, tips, and resources delivered to your
              inbox. No spam, unsubscribe anytime.
            </p>
          </div>

          {/* Right side — form */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="bg-white rounded-btn sm:rounded-r-none py-3.5 px-5 text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold w-full sm:w-72"
              />
              <button
                type="submit"
                className="bg-accent-gold text-heading font-semibold rounded-btn sm:rounded-l-none px-6 py-3.5 flex items-center justify-center gap-2 hover:brightness-110 transition-all mt-3 sm:mt-0"
              >
                Subscribe
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-white/50 text-sm mt-3 text-center sm:text-left">
              Join 10,000+ developers and creators
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
