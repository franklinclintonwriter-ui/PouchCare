import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Sparkle decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-6 left-[10%] w-6 h-6 text-white/20" />
        <Sparkles className="absolute top-12 left-[5%] w-4 h-4 text-white/15" />
        <Sparkles className="absolute bottom-8 left-[15%] w-5 h-5 text-white/20" />
        <Sparkles className="absolute top-8 right-[8%] w-5 h-5 text-white/15" />
        <Sparkles className="absolute bottom-6 right-[12%] w-4 h-4 text-white/10" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/30 via-transparent to-accent-cyan/10" />
      </div>

      <div className="relative z-10 max-w-container mx-auto px-6 py-14 text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">
          Ready to Build Something Amazing?
        </h2>
        <p className="mt-3 text-white/80 max-w-xl mx-auto">
          Join thousands of creators using PouchCare to build incredible
          websites. Start your free trial today.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 mt-6 bg-white text-primary font-semibold px-8 py-3.5 rounded-btn transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] shadow-lg group"
        >
          Get Started Free
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
