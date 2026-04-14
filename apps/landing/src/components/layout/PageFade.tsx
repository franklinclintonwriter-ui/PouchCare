import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function PageFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [display, setDisplay] = useState(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setDisplay(false);
    const t = setTimeout(() => setDisplay(true), 60);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: display ? 1 : 0,
        transition: "opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity",
      }}
    >
      {children}
    </div>
  );
}
