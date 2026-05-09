import Hero from "../components/sections/Hero";
import StatsBar from "../components/sections/StatsBar";
import TrustBadges from "../components/sections/TrustBadges";
import Features from "../components/sections/Features";
import HowItWorks from "../components/sections/HowItWorks";
import Showcase from "../components/sections/Showcase";
import TestimonialsCarousel from "../components/sections/TestimonialsCarousel";
import Integrations from "../components/sections/Integrations";
import Partners from "../components/sections/Partners";
import NewsletterSignup from "../components/sections/NewsletterSignup";
import CTABanner from "../components/sections/CTABanner";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TrustBadges />
      <Features />
      <HowItWorks />
      <Showcase />
      <TestimonialsCarousel />
      <Integrations />
      <Partners />
      <NewsletterSignup />
      <CTABanner />
    </>
  );
}
