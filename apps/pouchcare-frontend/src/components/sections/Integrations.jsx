import { useIntersection } from "../../hooks/useIntersection";
import { ArrowRight } from "lucide-react";

const integrations = [
  { name: "WordPress", color: "#21759B" },
  { name: "WooCommerce", color: "#96588A" },
  { name: "Elementor", color: "#92003B" },
  { name: "Gutenberg", color: "#000000" },
  { name: "Yoast SEO", color: "#A4286A" },
  { name: "Mailchimp", color: "#FFE01B" },
  { name: "Stripe", color: "#635BFF" },
  { name: "Google Analytics", color: "#E37400" },
  { name: "Cloudflare", color: "#F38020" },
  { name: "GitHub", color: "#181717" },
  { name: "Figma", color: "#F24E1E" },
  { name: "Zapier", color: "#FF4A00" },
];

function IntegrationChip({ integration, index }) {
  const [ref, isVisible] = useIntersection();

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2.5 bg-white rounded-lg border border-gray-200 px-4 py-3 transition-all duration-300 hover:shadow-card hover:border-primary hover:-translate-y-0.5 cursor-default ${
        isVisible ? "animate-fadeUp" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: integration.color }}
      />
      <span className="font-heading font-medium text-heading text-sm whitespace-nowrap">
        {integration.name}
      </span>
    </div>
  );
}

export default function Integrations() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
            Works With Your Favorite Tools
          </h2>
          <p className="mt-4 text-body text-lg leading-relaxed">
            Seamless integrations with the tools you already use
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {integrations.map((integration, i) => (
            <IntegrationChip key={i} integration={integration} index={i} />
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-body mb-2">And 100+ more integrations</p>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
          >
            View All Integrations
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
