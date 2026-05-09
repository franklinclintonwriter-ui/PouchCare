import { Layout, Paintbrush, Rocket } from "lucide-react";
import { useIntersection } from "../../hooks/useIntersection";

const steps = [
  {
    number: 1,
    title: "Choose a Template",
    description:
      "Browse our library of 50+ professionally designed templates. Find the perfect starting point for your project.",
    Icon: Layout,
  },
  {
    number: 2,
    title: "Customize Everything",
    description:
      "Use our powerful drag-and-drop builder to customize colors, fonts, layouts, and content to match your brand.",
    Icon: Paintbrush,
  },
  {
    number: 3,
    title: "Launch Your Site",
    description:
      "One-click publishing to go live. Your optimized, responsive website is ready for the world.",
    Icon: Rocket,
  },
];

function StepCard({ step, index }) {
  const [ref, isVisible] = useIntersection();

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center text-center ${
        isVisible ? "animate-fadeUp" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Numbered circle */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white font-heading font-bold text-sm mb-4">
        {step.number}
      </div>

      {/* Icon box */}
      <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        <step.Icon className="w-9 h-9" />
      </div>

      {/* Text */}
      <h3 className="font-heading text-xl font-semibold text-heading mb-2">
        {step.title}
      </h3>
      <p className="text-sm text-body leading-relaxed max-w-xs">
        {step.description}
      </p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
            Get Started in 3 Simple Steps
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Dashed connector lines — desktop only */}
          <div
            className="hidden md:block absolute top-[72px] left-1/3 right-1/3 border-t-2 border-dashed border-primary/30"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
