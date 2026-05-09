import { Link } from "react-router-dom";
import { ArrowRight, Download } from "lucide-react";
import { downloadLinks } from "../../config/downloads";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-white to-blue-50 circuit-bg">
      {/* Decorative flowing shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none">
        <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-30">
          <defs>
            <linearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A7AFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00C6FF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="heroGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00C6FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0A7AFF" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M300 50C450 50 550 150 550 300C550 450 450 550 300 550C200 550 120 480 80 400C40 320 60 200 150 120C220 60 280 50 300 50Z" fill="url(#heroGrad1)" />
          <path d="M350 100C480 120 560 220 540 350C520 480 400 560 270 540C180 525 110 460 90 370C70 280 120 180 210 120C270 80 320 90 350 100Z" fill="url(#heroGrad2)" />
        </svg>
      </div>

      <div className="max-w-container mx-auto px-6 py-20 lg:py-28 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left content */}
          <div className="flex-1 max-w-xl lg:max-w-none">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-heading leading-tight">
              Build Beautiful Websites{" "}
              <span className="text-gradient">Faster</span> with PouchCare
            </h1>
            <p className="mt-6 text-lg text-body leading-relaxed max-w-lg">
              The all-in-one WordPress theme and builder toolkit for agencies,
              freelancers, and businesses. Create stunning sites in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/templates"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-7 py-3.5 rounded-btn transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/20"
              >
                Explore Templates
              </Link>
              <a
                href={downloadLinks.theme}
                download
                className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-7 py-3.5 rounded-btn transition-all duration-200 hover:bg-primary-light"
              >
                <Download className="w-4 h-4" />
                Download Theme
              </a>
              <a
                href={downloadLinks.plugin}
                download
                className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-7 py-3.5 rounded-btn transition-all duration-200 hover:bg-primary-light"
              >
                <Download className="w-4 h-4" />
                Download Plugin
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-7 py-3.5 rounded-btn transition-all duration-200 hover:bg-primary-light group"
              >
                View Features
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right — Large logo emblem */}
          <div className="flex-shrink-0 relative">
            <div className="w-64 h-64 md:w-80 md:h-80 lg:w-[360px] lg:h-[360px] relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent-cyan/20 blur-2xl scale-110" />
              {/* Main logo */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full relative z-10 drop-shadow-2xl"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0A7AFF" />
                    <stop offset="100%" stopColor="#00C6FF" />
                  </linearGradient>
                </defs>
                <rect width="200" height="200" rx="40" fill="url(#logoBg)" />
                {/* P letter */}
                <path
                  d="M50 55h30a22 22 0 0 1 0 44H65v30H50V55zm15 32h15a10 10 0 0 0 0-20H65v20z"
                  fill="white"
                />
                {/* C letter */}
                <path
                  d="M110 75a30 30 0 0 1 30-30h5v14h-5a16 16 0 0 0-16 16v22a30 30 0 0 1-30 30h-5v-14h5a16 16 0 0 0 16-16V75z"
                  fill="white"
                />
                {/* Circuit lines */}
                <line x1="140" y1="110" x2="165" y2="110" stroke="white" strokeWidth="3" opacity="0.8" />
                <line x1="165" y1="110" x2="165" y2="140" stroke="white" strokeWidth="3" opacity="0.8" />
                <line x1="165" y1="140" x2="180" y2="140" stroke="white" strokeWidth="3" opacity="0.8" />
                {/* Gold dot */}
                <circle cx="180" cy="140" r="5" fill="#FFB800" />
                {/* Secondary circuit */}
                <line x1="50" y1="140" x2="35" y2="140" stroke="white" strokeWidth="2" opacity="0.5" />
                <line x1="35" y1="140" x2="35" y2="160" stroke="white" strokeWidth="2" opacity="0.5" />
                <circle cx="35" cy="160" r="3" fill="white" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
