const IMAGE_MAP: Record<string, string> = {
  "On-Page SEO": "/images/services/on-page-seo.svg",
  "Link Building": "/images/services/link-building.svg",
  "Technical SEO": "/images/services/technical-seo.svg",
  "Local SEO": "/images/services/local-seo.svg",
  "Web Development": "/images/services/web-development.svg",
  "App Development": "/images/services/app-development.svg",
  "E-commerce Dev": "/images/services/ecommerce-dev.svg",
  "WordPress Dev": "/images/services/wordpress-dev.svg",
  "UI/UX Design": "/images/services/ui-ux-design.svg",
  "Video Editing": "/images/services/video-editing.svg",
  "Content Writing": "/images/services/content-writing.svg",
  Copywriting: "/images/services/copywriting.svg",
  "Google Ads": "/images/services/google-ads.svg",
  "Facebook Ads": "/images/services/facebook-ads.svg",
  "Domain registration": "/images/services/domain-registration.svg",
  "Web hosting": "/images/services/web-hosting.svg",
  "SSL & DNS management": "/images/services/ssl-dns-management.svg",
};

export function ServiceIllustration({
  name,
  className,
}: {
  name: string;
  category?: string;
  className?: string;
}) {
  const src = IMAGE_MAP[name];
  if (!src) {
    return (
      <svg viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="36" fill="#6b7280" opacity=".12" />
        <circle cx="60" cy="60" r="20" fill="#6b7280" opacity=".2" />
        <circle cx="60" cy="60" r="8" fill="#6b7280" opacity=".4" />
      </svg>
    );
  }
  return <img src={src} alt={name} loading="lazy" className={className} />;
}
