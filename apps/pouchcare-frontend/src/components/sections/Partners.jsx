import { partners } from "../../data/partners";
import { useIntersection } from "../../hooks/useIntersection";

function PartnerLogo({ name, color }) {
  return (
    <div className="group flex items-center justify-center px-6 py-3 transition-all duration-300">
      <span
        className="font-heading text-xl font-bold tracking-wide transition-all duration-300 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100"
        style={{ color }}
      >
        {name}
      </span>
    </div>
  );
}

export default function Partners() {
  const [ref, isVisible] = useIntersection();

  return (
    <section className="py-16 bg-surface-light/50">
      <div
        ref={ref}
        className={`max-w-container mx-auto px-6 ${
          isVisible ? "animate-fadeUp" : "opacity-0"
        }`}
      >
        <p className="text-center text-sm font-medium text-muted uppercase tracking-widest mb-8">
          Trusted by Professionals
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner) => (
            <PartnerLogo key={partner.name} {...partner} />
          ))}
        </div>
      </div>
    </section>
  );
}
