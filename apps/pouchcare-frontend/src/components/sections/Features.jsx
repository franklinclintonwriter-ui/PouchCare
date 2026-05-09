import { Blocks, Layout, Palette, Zap } from "lucide-react";
import { features } from "../../data/features";
import { useIntersection } from "../../hooks/useIntersection";

const iconMap = { Blocks, Layout, Palette, Zap };

function FeatureCard({ feature, index }) {
  const [ref, isVisible] = useIntersection();
  const Icon = iconMap[feature.icon] || Blocks;

  return (
    <div
      ref={ref}
      className={`group bg-white rounded-card border border-gray-100 p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-t-[3px] hover:border-t-primary ${
        isVisible ? "animate-fadeUp" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-heading">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm text-body leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="bg-surface-light py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
            Everything You Need to Build
          </h2>
          <p className="mt-4 text-body text-lg">
            Powerful features designed to help you create stunning WordPress
            websites faster than ever before.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
