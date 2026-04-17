import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageFade } from "@/components/layout/PageFade";

export function MarketingLayout() {
  return (
    <div className="landing-theme flex min-h-screen flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900">
      <Navbar />
      <main className="flex-1 pb-[env(safe-area-inset-bottom,0px)]">
        <PageFade>
          <Outlet />
        </PageFade>
      </main>
      <Footer />
    </div>
  );
}
