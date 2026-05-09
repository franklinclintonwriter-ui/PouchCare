import { Puzzle, Palette, Headphones } from "lucide-react";
import { useIntersection } from "../../hooks/useIntersection";
import { useEffect, useState } from "react";

function AnimatedCounter({ target, suffix = "", duration = 1500 }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useIntersection();

  useEffect(() => {
    if (!isVisible) return;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [isVisible, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const stats = [
  {
    icon: Puzzle,
    value: 120,
    suffix: "+",
    label: "Amazing Plugins",
  },
  {
    icon: Palette,
    value: 50,
    suffix: "+",
    label: "Starter & Custom Templates",
  },
  {
    icon: Headphones,
    value: 24,
    suffix: "/7",
    label: "Fast Support",
  },
];

export default function StatsBar() {
  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x divide-gray-100">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-4 py-2"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-heading text-2xl font-bold text-heading">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-body">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
