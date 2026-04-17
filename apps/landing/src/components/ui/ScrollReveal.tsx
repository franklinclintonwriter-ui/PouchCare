import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delay?: number;
  /** Entry direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distance in pixels to travel */
  distance?: number;
  /** How early to trigger (positive = earlier) */
  rootMargin?: string;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 20,
  rootMargin = '0px 0px -48px 0px',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use a small root margin so elements start animating just before they
    // enter the viewport — prevents the "pop in at the last moment" feeling.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Map direction → starting transform (hidden state)
  const hiddenTransform: Record<string, string> = {
    up:    `translateY(${distance}px)`,
    down:  `translateY(-${distance}px)`,
    left:  `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none:  'none',
  };

  const style: CSSProperties = {
    // Only transition opacity + transform — never 'all'
    // (avoids layout recalculation on every frame)
    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                 transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)`,
    transitionDelay: `${delay}ms`,
    // GPU compositing hint — hoisted to its own layer
    willChange: visible ? 'auto' : 'opacity, transform',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) translateX(0)' : hiddenTransform[direction],
  };

  return (
    <div ref={ref} style={style} className={cn(className)}>
      {children}
    </div>
  );
}
