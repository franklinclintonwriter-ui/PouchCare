import { Star, Users, Shield, Clock } from "lucide-react";
import { useIntersection } from "../../hooks/useIntersection";

const metrics = [
  { value: "4.9/5", label: "Average Rating", Icon: Star },
  { value: "10,000+", label: "Active Users", Icon: Users },
  { value: "99.9%", label: "Uptime SLA", Icon: Shield },
  { value: "< 2hrs", label: "Response Time", Icon: Clock },
];

export default function TrustBadges() {
  const [ref, isVisible] = useIntersection();

  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div
        ref={ref}
        className={`max-w-container mx-auto px-6 ${
          isVisible ? "animate-fadeIn" : "opacity-0"
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <metric.Icon className="w-5 h-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-heading">
                {metric.value}
              </span>
              <span className="text-sm text-body mt-0.5">{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
