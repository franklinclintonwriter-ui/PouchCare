import { ExternalLink } from "lucide-react";
import { useIntersection } from "../../hooks/useIntersection";

const projects = [
  { name: "Artisan Coffee Co.", category: "eCommerce", color: "#2D1B0E" },
  { name: "TechNova Labs", category: "SaaS", color: "#0A7AFF" },
  { name: "Wanderlust Travel", category: "Blog", color: "#0E7C61" },
  { name: "Luxe Interiors", category: "Portfolio", color: "#8B6914" },
  { name: "FitLife Studio", category: "Landing Page", color: "#D63031" },
  { name: "Urban Eats", category: "Restaurant", color: "#E17055" },
];

function ProjectCard({ project, index }) {
  const [ref, isVisible] = useIntersection();

  return (
    <div
      ref={ref}
      className={`group relative rounded-card overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.03] ${
        isVisible ? "animate-fadeUp" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient preview area */}
      <div
        className="h-56 relative flex items-end p-5"
        style={{
          background: `linear-gradient(135deg, ${project.color}, ${project.color}cc)`,
        }}
      >
        {/* Category tag */}
        <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
          {project.category}
        </span>

        {/* Project name */}
        <h3 className="font-heading text-xl font-bold text-white drop-shadow-md">
          {project.name}
        </h3>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center gap-2 bg-white text-heading font-semibold px-5 py-2.5 rounded-btn text-sm">
            Coming Soon
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Showcase() {
  return (
    <section className="bg-surface-light py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-heading">
            See What's Possible
          </h2>
          <p className="mt-4 text-body text-lg leading-relaxed">
            Real websites built by real creators using PouchCare
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <ProjectCard key={i} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
