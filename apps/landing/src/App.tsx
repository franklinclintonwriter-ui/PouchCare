import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

const Home = lazy(() => import("@/pages/Home"));
const Services = lazy(() => import("@/pages/Services"));
const Backlinks = lazy(() => import("@/pages/Backlinks"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

/* ── Full-screen loader shown during lazy-chunk load ─────────────────────── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
      <div className="flex flex-col items-center gap-4">
        <div className="w-9 h-9 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    </div>
  );
}

/* ── Per-page fade-in wrapper ─────────────────────────────────────────────── */
function PageFade({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [display, setDisplay] = useState(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // Fade out → swap → fade in
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

/* ── Root ─────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="landing-theme min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900">
        <Navbar />
        <main className="flex-1">
          <PageFade>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/backlinks" element={<Backlinks />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PageFade>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
