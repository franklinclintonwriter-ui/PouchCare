import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

/** Easing: ease-out cubic */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  end,
  duration = 1800,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();

          let rafId: number;
          let startTime: number | null = null;

          const tick = (ts: number) => {
            if (startTime === null) startTime = ts;
            const elapsed = ts - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setValue(Math.floor(easeOutCubic(progress) * end));
            if (progress < 1) {
              rafId = requestAnimationFrame(tick);
            } else {
              setValue(end);
            }
          };

          rafId = requestAnimationFrame(tick);
          return () => cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span
      ref={ref}
      style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}
    >
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
