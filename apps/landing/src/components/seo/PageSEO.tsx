import { useEffect } from "react";

interface PageSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  /** Comma-separated keywords for the <meta name="keywords"> tag */
  keywords?: string;
  /** Pass a pre-built JSON-LD object to inject alongside the page meta */
  schema?: object;
}

const SITE_NAME = "PouchCare";
/**
 * Default OG image — must exist in /public.
 * pouchcare-logo-main.png is the verified transparent PNG.
 */
const DEFAULT_OG = "/pouchcare-logo-main.png";
const BASE_URL = "https://pouchcare.com";

/** Injects / replaces a single <meta> tag in <head> */
function setMeta(name: string, content: string, attr = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Injects / replaces a single <link> tag in <head> */
function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Injects / replaces a JSON-LD <script> tag identified by a data attribute */
function setJsonLd(id: string, data: object) {
  let el = document.querySelector<HTMLScriptElement>(
    `script[data-schema-id="${id}"]`,
  );
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-schema-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data, null, 0);
}

/**
 * Normalise a canonical path:
 *  "/"        → "https://pouchcare.com"     (no trailing slash on root)
 *  "/about"   → "https://pouchcare.com/about"
 *  "/blog/x"  → "https://pouchcare.com/blog/x"
 */
function buildCanonical(path: string): string {
  if (path === "/") return BASE_URL;
  // Strip any accidental trailing slash from non-root paths
  const clean = path.endsWith("/") ? path.slice(0, -1) : path;
  return `${BASE_URL}${clean}`;
}

export function PageSEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG,
  keywords,
  schema,
}: PageSEOProps) {
  // Title separator: always use em-dash for consistency
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;

  const canonicalUrl = canonical ? buildCanonical(canonical) : undefined;

  // Ensure OG image is always an absolute URL
  const ogImageFull = ogImage.startsWith("http")
    ? ogImage
    : `${BASE_URL}${ogImage}`;

  useEffect(() => {
    /* ── Title ── */
    document.title = fullTitle;

    /* ── Standard meta ── */
    setMeta("description", description);
    setMeta("robots", "index, follow");
    if (keywords) setMeta("keywords", keywords);

    /* ── Open Graph ── */
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:image", ogImageFull, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", fullTitle, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:locale", "en_US", "property");
    if (canonicalUrl) setMeta("og:url", canonicalUrl, "property");

    /* ── Twitter Card ── */
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@pouchcare");
    setMeta("twitter:creator", "@pouchcare");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImageFull);
    setMeta("twitter:image:alt", fullTitle);

    /* ── Canonical link ── */
    if (canonicalUrl) setLink("canonical", canonicalUrl);

    /* ── Custom JSON-LD schema (e.g. Person, Article) ── */
    if (schema) setJsonLd("page-schema", schema);
  }, [fullTitle, description, canonicalUrl, ogImageFull, keywords, schema]);

  return null;
}