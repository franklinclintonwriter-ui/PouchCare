// ── Services ──────────────────────────────────────────────────────────────

export interface ServiceItem {
  icon: string;
  name: string;
  price: string;
  category: string;
  description: string;
  image?: string;
  badge?: string;
}

export const SERVICES: ServiceItem[] = [
  {
    icon: "🔍",
    name: "On-Page SEO",
    price: "from $200",
    category: "SEO",
    description:
      "Full technical audit, keyword mapping, and on-page optimization for maximum rankings.",
    image: "/images/services/on-page-seo.svg",
    badge: "Popular",
  },
  {
    icon: "🔗",
    name: "Link Building",
    price: "from $15/link",
    category: "SEO",
    description:
      "High-authority guest posts and niche edits that move the needle on your domain authority.",
    image: "/images/services/link-building.svg",
    badge: "Best Seller",
  },
  {
    icon: "⚙️",
    name: "Technical SEO",
    price: "from $300",
    category: "SEO",
    description:
      "Core Web Vitals, crawlability, schema markup and site architecture improvements.",
    image: "/images/services/technical-seo.svg",
  },
  {
    icon: "📍",
    name: "Local SEO",
    price: "from $150",
    category: "SEO",
    description:
      "Google Business Profile optimization and local citation building for brick-and-mortar.",
    image: "/images/services/local-seo.svg",
  },
  {
    icon: "💻",
    name: "Web Development",
    price: "from $299",
    category: "Dev",
    description:
      "Fast, modern websites and web apps built with React, Next.js, and WordPress.",
    image: "/images/services/web-development.svg",
    badge: "Popular",
  },
  {
    icon: "📱",
    name: "App Development",
    price: "from $999",
    category: "Dev",
    description:
      "Cross-platform mobile apps built with React Native for iOS and Android.",
    image: "/images/services/app-development.svg",
  },
  {
    icon: "🛒",
    name: "E-commerce Dev",
    price: "from $599",
    category: "Dev",
    description:
      "High-converting Shopify, WooCommerce, and custom e-commerce solutions.",
    image: "/images/services/ecommerce-dev.svg",
  },
  {
    icon: "🔧",
    name: "WordPress Dev",
    price: "from $199",
    category: "Dev",
    description:
      "Custom themes, plugins, and performance optimization for WordPress sites.",
    image: "/images/services/wordpress-dev.svg",
  },
  {
    icon: "🎨",
    name: "UI/UX Design",
    price: "from $49",
    category: "Design",
    description:
      "Beautiful, conversion-focused designs in Figma for web and mobile.",
    image: "/images/services/ui-ux-design.svg",
  },
  {
    icon: "🎬",
    name: "Video Editing",
    price: "from $79",
    category: "Design",
    description:
      "Professional video editing for YouTube, social media, and ads.",
    image: "/images/services/video-editing.svg",
  },
  {
    icon: "📝",
    name: "Content Writing",
    price: "from $25/article",
    category: "Content",
    description:
      "SEO-optimized blog posts, web copy, and product descriptions by native writers.",
    image: "/images/services/content-writing.svg",
  },
  {
    icon: "✏️",
    name: "Copywriting",
    price: "from $35",
    category: "Content",
    description:
      "High-converting sales pages, email sequences, and ad copy that drives action.",
    image: "/images/services/copywriting.svg",
  },
  {
    icon: "📣",
    name: "Google Ads",
    price: "from $200/mo",
    category: "Ads",
    description:
      "ROI-focused PPC campaigns managed by certified Google Ads specialists.",
    image: "/images/services/google-ads.svg",
  },
  {
    icon: "📘",
    name: "Facebook Ads",
    price: "from $150/mo",
    category: "Ads",
    description:
      "Profitable Meta advertising across Facebook and Instagram audiences.",
    image: "/images/services/facebook-ads.svg",
  },
  {
    icon: "📱",
    name: "Social Media Marketing",
    price: "from $250/mo",
    category: "Ads",
    description:
      "Strategic social media management across Instagram, TikTok, LinkedIn and Twitter to grow your brand organically.",
    image: "/images/services/social-media-marketing.svg",
  },
  {
    icon: "📧",
    name: "Email Marketing",
    price: "from $150/mo",
    category: "Content",
    description:
      "Automated email sequences, newsletters, and drip campaigns that convert subscribers into paying customers.",
    image: "/images/services/email-marketing.svg",
  },
  {
    icon: "🎯",
    name: "Brand Strategy",
    price: "from $499",
    category: "Design",
    description:
      "Complete brand identity packages — logo design, brand guidelines, color palettes, and typography systems.",
    image: "/images/services/brand-strategy.svg",
  },
  {
    icon: "📊",
    name: "Analytics & Reporting",
    price: "from $100/mo",
    category: "SEO",
    description:
      "GA4 setup, custom dashboards, conversion tracking, and monthly performance reports with actionable insights.",
    image: "/images/services/analytics-reporting.svg",
  },
  {
    icon: "🔄",
    name: "CRO & A/B Testing",
    price: "from $350",
    category: "Dev",
    description:
      "Conversion rate optimization through data-driven A/B testing, heatmaps, and user behavior analysis.",
    image: "/images/services/cro-testing.svg",
  },
  {
    icon: "🌐",
    name: "Web to APK",
    price: "from $49",
    category: "Dev",
    description:
      "Convert any website into a native Android APK app — published to Google Play Store with push notifications.",
    image: "/images/services/web-to-apk.svg",
  },
];

// ── Backlink packages (fallback) ──────────────────────────────────────────

export interface BacklinkPackage {
  name: string;
  da: string;
  type: string;
  perLink: string;
  x10: string;
  x50: string;
  x100: string;
  x1000: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export const BACKLINK_PACKAGES: BacklinkPackage[] = [
  {
    name: "Starter GP",
    da: "DA 20-30",
    type: "Guest Post",
    perLink: "$15",
    x10: "$130",
    x50: "$600",
    x100: "$1,100",
    x1000: "$9,500",
  },
  {
    name: "Standard GP",
    da: "DA 30-40",
    type: "Guest Post",
    perLink: "$30",
    x10: "$265",
    x50: "$1,300",
    x100: "$2,400",
    x1000: "$22,000",
    isPopular: true,
  },
  {
    name: "Premium GP",
    da: "DA 50+",
    type: "Guest Post",
    perLink: "$80",
    x10: "$720",
    x50: "$3,600",
    x100: "$6,800",
    x1000: "$65,000",
  },
  {
    name: "Niche Edit",
    da: "DA 30-40",
    type: "Niche Edit",
    perLink: "$25",
    x10: "$220",
    x50: "$1,050",
    x100: "$1,950",
    x1000: "$18,000",
  },
  {
    name: "Bulk Mixed",
    da: "Mixed",
    type: "Mixed",
    perLink: "$10",
    x10: "$88",
    x50: "$420",
    x100: "$800",
    x1000: "$7,500",
    isBestValue: true,
  },
  {
    name: "Web 2.0",
    da: "N/A",
    type: "Web 2.0",
    perLink: "$2",
    x10: "$17",
    x50: "$80",
    x100: "$150",
    x1000: "$1,200",
  },
  {
    name: "Forum Profile",
    da: "N/A",
    type: "Profile",
    perLink: "$0.50",
    x10: "$4",
    x50: "$18",
    x100: "$35",
    x1000: "$280",
  },
];

// ── Pricing plans ─────────────────────────────────────────────────────────

export interface Plan {
  name: string;
  monthlyPrice: number;
  color: string;
  isPopular?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 299,
    color: "text-slate-400",
    features: [
      "5 Guest Posts DA 20+",
      "On-Page SEO Audit",
      "Monthly Report",
      "Email Support",
      "1 Target Keyword",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 599,
    color: "text-sky-400",
    isPopular: true,
    features: [
      "15 Guest Posts DA 30+",
      "Full On-Page SEO",
      "Technical SEO Fix",
      "Priority Support",
      "Bi-weekly Strategy Calls",
      "5 Target Keywords",
    ],
  },
  {
    name: "Agency",
    monthlyPrice: 1299,
    color: "text-indigo-400",
    features: [
      "40 Guest Posts DA 40+",
      "Complete SEO Package",
      "Dedicated Account Manager",
      "White-label Reports",
      "Daily Reporting",
      "Unlimited Keywords",
    ],
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────

export interface Testimonial {
  name: string;
  flag: string;
  role: string;
  quote: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "James O'Brien",
    flag: "🇬🇧",
    role: "SEO Agency Owner, London",
    quote:
      "PouchCare's guest post quality is exceptional. DA 40+ placements at these prices — nowhere else comes close. We've white-labeled their service for three years running.",
    rating: 5,
  },
  {
    name: "Fatima Ahmed",
    flag: "🇵🇰",
    role: "E-commerce Founder",
    quote:
      "Organic traffic tripled in 4 months. The SEO retainer is the best investment we have made this year. The team is responsive, transparent, and actually delivers.",
    rating: 5,
  },
  {
    name: "Raj Mehta",
    flag: "🇺🇸",
    role: "SaaS CEO",
    quote:
      "Deep technical knowledge, transparent reporting, and they actually communicate. Rare in this industry. Our domain authority went from 22 to 51 in 8 months.",
    rating: 5,
  },
  {
    name: "Sofia Reyes",
    flag: "🇲🇽",
    role: "Digital Marketing Director",
    quote:
      "The backlink packages have the best ROI we have seen. We scaled from 10 links/month to 100+ with zero quality drop. PouchCare is our go-to link building partner.",
    rating: 5,
  },
  {
    name: "Ahmed Al-Rashid",
    flag: "🇦🇪",
    role: "Real Estate Platform Founder",
    quote:
      "Ranked our competitive keywords in 6 months. The team understands Dubai market nuances. Exceptional professionalism from day one.",
    rating: 5,
  },
];

// ── Team ──────────────────────────────────────────────────────────────────

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Abdullah Al Mamun (Abdullah Babu)",
    role: "Founder & CEO",
    avatar: "A",
    bio: "Bangladeshi Entrepreneur and Digital Strategist based in Dubai. Founder of AAWS and PouchCare. Best known for his work in search engine reputation management in Asia. Award-winning SEO expert with 10+ years of experience, recognised as South Asia's Marketing Pioneer.",
  },
  {
    name: "Nadia Chowdhury",
    role: "Head of SEO",
    avatar: "N",
    bio: "Former Google Ads specialist. Leads technical SEO strategy across 200+ client campaigns.",
  },
  {
    name: "Omar Sheikh",
    role: "Link Building Lead",
    avatar: "O",
    bio: "Manages our global network of 5,000+ publisher relationships and guest post inventory.",
  },
  {
    name: "Priya Singh",
    role: "Dev Team Lead",
    avatar: "P",
    bio: "Full-stack engineer specialising in WordPress, React, and performance optimisation.",
  },
  {
    name: "Zaid Al-Hassan",
    role: "Operations Manager",
    avatar: "Z",
    bio: "Coordinates delivery across our offices in Dubai, London, Dhaka, Karachi, and Lahore.",
  },
  {
    name: "Emma Clarke",
    role: "Client Success",
    avatar: "E",
    bio: "Ensures every client achieves measurable growth with weekly check-ins and detailed reporting.",
  },
];

// ── Stats ─────────────────────────────────────────────────────────────────

export const STATS = [
  { value: 500, suffix: "+", label: "Active Clients" },
  { value: 30, suffix: "+", label: "Countries Served" },
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 5, suffix: "", label: "Global Offices" },
];

// ── Why us ────────────────────────────────────────────────────────────────

export const WHY_US = [
  {
    icon: "🎯",
    title: "Results-First Approach",
    description:
      "We measure success by your rankings and revenue, not just deliverables. Every strategy is built around your specific goals.",
  },
  {
    icon: "🔒",
    title: "White-Hat Only",
    description:
      "No PBNs, no shortcuts. Every link we build and every SEO tactic we use is 100% compliant with Google guidelines.",
  },
  {
    icon: "📊",
    title: "Full Transparency",
    description:
      "Live dashboards, weekly reports, and direct Slack access to your account manager. You always know what is happening.",
  },
  {
    icon: "⚡",
    title: "Fast Turnaround",
    description:
      "Guest posts go live within 5-7 days. SEO changes are implemented within 48 hours. No waiting weeks for results.",
  },
  {
    icon: "🌍",
    title: "Global Network",
    description:
      "Access to 5,000+ publisher sites across every niche, in every language. Your perfect link is already in our inventory.",
  },
  {
    icon: "💰",
    title: "Best Price Guarantee",
    description:
      "Found lower prices for the same quality? We will beat it. Premium SEO does not have to cost a fortune.",
  },
];

// ── Blog posts ────────────────────────────────────────────────────────────

export interface BlogPost {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  slug: string;
  image: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  tags: string[];
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "10 Link Building Strategies That Actually Work in 2025",
    excerpt:
      "Guest posts, niche edits, digital PR — we break down which tactics are moving the needle right now and which ones to avoid entirely.",
    category: "Link Building",
    readTime: "8 min read",
    date: "Mar 28, 2025",
    slug: "link-building-strategies-2025",
    image: "/blog-link-building.png",
    author: "Omar Sheikh",
    authorRole: "Link Building Lead",
    authorAvatar: "O",
    tags: ["Link Building", "Guest Posts", "Niche Edits", "SEO Strategy"],
    body: [
      "Link building remains the single most powerful off-page SEO signal in 2025. Despite years of speculation that Google would reduce its reliance on backlinks, the reality — confirmed across hundreds of PouchCare campaigns — is that high-quality links from authoritative, niche-relevant sites still move rankings faster than anything else.",
      "But not all link building is created equal. The gap between tactics that work and tactics that risk a manual penalty has never been wider. Here are the ten strategies our team uses every day across 500+ active campaigns.",
      "**1. Editorial Guest Posts on Real Traffic Sites.** A contextual link inside a 1,000-word article on a DA 40+ site with genuine organic traffic is the gold standard. We vet every publisher for real Ahrefs traffic (minimum 1,000/mo), editorial standards, and spam score before publishing. Zero PBN sites, ever.",
      "**2. Niche Edits (Curated Links).** Inserting your link into an already-indexed, already-ranking article on a relevant site often delivers faster ranking improvements than new guest posts because the page already has authority flowing through it. Best for competitive keywords with a tight timeline.",
      "**3. Digital PR & Data-Driven Content.** Publishing original research, surveys, or industry data attracts natural editorial links from journalists and bloggers. One well-placed study can earn 50–200 links passively over 12 months. This is our highest ROI tactic for domain authority growth.",
      "**4. Broken Link Building.** Find high-authority pages linking to dead content in your niche, create a better replacement, and pitch site owners to swap the broken link for yours. Conversion rates average 8–15% — far higher than cold outreach.",
      '**5. Resource Page Link Building.** Many educational and industry sites maintain curated "best resources" pages. Getting listed on 10–20 relevant resource pages adds consistent, permanent, authority-passing links with minimal effort after the initial outreach.',
      "**6. HARO & Journalist Outreach.** Responding to reporter queries on platforms like HARO (Help A Reporter Out) can land placements on Forbes, Inc, HuffPost and similar publications — links that would cost thousands through other channels, completely free.",
      "**7. Competitor Backlink Replication.** Analyse your top 3 competitors in Ahrefs. For every link they have that you do not, run a targeted outreach campaign to acquire the same placement. This alone can eliminate a domain authority gap within 6 months.",
      "**8. Podcast & Interview Appearances.** Being featured as a guest on industry podcasts earns bio links from the show notes page — often high-DA media sites with strong topical authority. 2–3 podcast appearances per month compounds significantly.",
      "**9. Scholarship Link Building.** Creating a legitimate scholarship for students in your industry and promoting it to university .edu pages earns some of the most powerful links available. The effort is upfront but the links last indefinitely.",
      "**10. Strategic Internal Link Optimisation.** While not an off-page tactic, restructuring your internal link architecture to pass equity from high-authority pages to your target pages can produce ranking lifts within weeks — without building a single new external link.",
      "The key insight across all of these strategies is consistency. A single month of aggressive link building followed by inactivity produces weaker, less stable results than a steady cadence of 10–20 quality links per month. Our most successful clients maintain a continuous link acquisition programme, not a one-off campaign.",
    ],
  },
  {
    title: "How We Tripled Organic Traffic for an E-commerce Store in 90 Days",
    excerpt:
      "A behind-the-scenes case study: the exact technical fixes, content gaps we filled, and the 42-link building campaign that tripled organic revenue in just 3 months.",
    category: "Case Study",
    readTime: "12 min read",
    date: "Mar 15, 2025",
    slug: "ecommerce-seo-case-study",
    image: "/blog-ecommerce-seo.png",
    author: "Nadia Chowdhury",
    authorRole: "Head of SEO",
    authorAvatar: "N",
    tags: ["Case Study", "E-commerce SEO", "Traffic Growth", "Link Building"],
    body: [
      "In October 2024, a UK-based women's fashion retailer came to us with a familiar problem: 8,000 monthly organic visitors, flat for 18 months, and a paid ads budget eating 60% of their margin. They wanted to own their traffic, not rent it.",
      "After a full site audit and competitive analysis, we identified three root causes: severe technical crawlability issues, thin product and category page content, and almost no backlink profile (DA 18, 43 referring domains). Here is exactly what we did.",
      "**Phase 1 — Technical Fixes (Weeks 1–2).** The site had 340 duplicate pages created by faceted navigation (colour/size filters generating unique URLs). We implemented canonical tags and noindex directives, eliminating duplicate content that was diluting crawl budget and splitting ranking signals. We also fixed 67 broken internal links, improved page load speed from 4.2s to 1.8s LCP, and added schema markup to all product pages.",
      '**Phase 2 — Content Expansion (Weeks 2–6).** We identified 28 category-level keywords with high commercial intent that the site was not targeting at all — terms like "sustainable midi dresses UK" and "petite workwear capsule wardrobe". Our content team produced fully optimised category descriptions and 12 long-form buying guides (1,500–2,500 words each) targeting informational intent queries that feed the purchase funnel.',
      '**Phase 3 — Link Building (Weeks 3–12).** We built 42 links in total: 18 DA 30–45 guest posts in fashion, lifestyle, and sustainability publications; 14 niche edits on already-ranking content; and 10 digital PR placements earned through a study we created on "UK women\'s sustainable fashion spending habits" (picked up by 4 national newspapers).',
      "**The Results at Day 90.** Organic sessions grew from 8,000 to 26,400 per month (+230%). Non-brand keyword rankings increased from 180 to 890 page-1 positions. Domain authority climbed from 18 to 31. Most importantly, organic revenue tripled — the client was able to reduce their Google Ads spend by 35% while growing overall revenue by 28%.",
      "The lesson? E-commerce SEO is rarely about one thing. The compounding effect of fixing technical foundations, closing content gaps, and building authority simultaneously is far more powerful than any single tactic in isolation. The 90-day timeline was aggressive — most sites see this level of growth in 4–6 months — but the client's existing brand recognition and site structure gave us a head start.",
    ],
  },
  {
    title: "Technical SEO Checklist: 47 Items to Audit Before Building Links",
    excerpt:
      "Building links to a broken site is like pouring water into a leaky bucket. Run through our 47-point technical audit first and watch every link work twice as hard.",
    category: "Technical SEO",
    readTime: "15 min read",
    date: "Feb 28, 2025",
    slug: "technical-seo-checklist",
    image: "/blog-technical-seo.png",
    author: "Nadia Chowdhury",
    authorRole: "Head of SEO",
    authorAvatar: "N",
    tags: ["Technical SEO", "Site Audit", "Core Web Vitals", "Crawlability"],
    body: [
      "One of the most common mistakes we see new SEO clients make is investing heavily in link building before their site is technically healthy. A great backlink pointing to a slow, crawl-error-ridden page is a wasted asset. Here is our internal 47-point checklist, condensed into the essential categories.",
      "**Crawlability & Indexation (10 checks).** Verify robots.txt is not accidentally blocking important pages. Confirm your XML sitemap is submitted to Google Search Console and contains only indexable URLs. Check for noindex tags on pages that should rank. Audit your crawl budget by reviewing GSC's crawl stats. Identify and resolve redirect chains longer than 2 hops.",
      "**Core Web Vitals (8 checks).** Largest Contentful Paint (LCP) should be under 2.5s. Cumulative Layout Shift (CLS) under 0.1. Interaction to Next Paint (INP) under 200ms. Run PageSpeed Insights on your 10 most important pages — not just the homepage. Optimise images: compress, use WebP format, add lazy loading, and specify width/height attributes to prevent layout shifts.",
      "**On-Page Fundamentals (12 checks).** Every page needs a unique, compelling title tag under 60 characters with the primary keyword near the front. Meta descriptions should be 140–160 characters, benefit-led, and include a call to action. H1 tags must be unique — one per page. Heading hierarchy (H1 → H2 → H3) must follow a logical structure. Ensure all images have descriptive alt text.",
      "**URL Structure & Internal Linking (7 checks).** URLs should be short, descriptive, and lowercase with hyphens. Eliminate dynamic parameter URLs where possible. Audit for orphaned pages (pages with no internal links pointing to them). Build topical cluster structures where pillar pages link to supporting content and vice versa.",
      "**Duplicate Content & Canonicalisation (5 checks).** Use Screaming Frog to identify pages with identical or near-identical content. Set canonical tags on all paginated pages and filtered views. Confirm that www vs non-www and http vs https versions all redirect to a single canonical domain.",
      "**Schema Markup (5 checks).** Implement appropriate schema for your content type: Article, Product, FAQ, LocalBusiness, BreadcrumbList. Test all schema using Google's Rich Results Test. Validate that your FAQ schema matches the visible on-page content.",
      "Running through this checklist before starting any link building campaign consistently produces better results. In our experience, sites that fix technical issues first see 40–60% better ranking improvements per link built compared to technically broken sites receiving the same links.",
    ],
  },
  {
    title:
      "The Complete On-Page SEO Guide for 2025: Rank Higher Without More Links",
    excerpt:
      "Master the on-page fundamentals that Google rewards in 2025 — from title tag formulas and content structure to E-E-A-T signals that build lasting authority.",
    category: "On-Page SEO",
    readTime: "10 min read",
    date: "Feb 10, 2025",
    slug: "on-page-seo-guide-2025",
    image: "/blog-onpage-seo.png",
    author: "Nadia Chowdhury",
    authorRole: "Head of SEO",
    authorAvatar: "N",
    tags: ["On-Page SEO", "Title Tags", "E-E-A-T", "Content Strategy"],
    body: [
      "On-page SEO is often underestimated. Many site owners assume that once they have written content and added keywords, the page is optimised. In reality, the difference between a page on position 15 and position 1 often comes down to a dozen on-page signals that take less than an hour to fix — but most people never bother.",
      "**The Title Tag Formula That Works.** The most effective title tag structure in 2025 is: [Primary Keyword] — [Benefit or Modifier] | [Brand]. Keep it under 60 characters. Front-load the keyword. Make the benefit genuinely compelling — your title tag is your paid ad in the organic results. Test 3–4 variations using Google Search Console CTR data and iterate every 60–90 days.",
      "**Content Structure That Satisfies Search Intent.** Before writing a single word, search your target keyword and analyse the top 10 results. What format do they use? Listicle, guide, comparison, tool? What sub-topics do they cover? Your content needs to match search intent at every level. Google is not just matching keywords — it is inferring what the user actually wants to accomplish.",
      "**E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness.** Post-Helpful Content Update, E-E-A-T signals matter more than ever for YMYL (Your Money, Your Life) topics. Demonstrate first-hand experience through original data, case studies, and specific examples. Add author bios with verifiable credentials. Include references and cite sources. Make your About page genuinely informative.",
      '**Semantic SEO and Topic Coverage.** Google\'s understanding of language is sophisticated enough to reward pages that cover a topic comprehensively, not just pages that repeat the target keyword. Use tools like Clearscope or SurferSEO to identify semantically related terms your content should include. A page about "link building" should naturally mention anchor text, domain authority, referring domains — not because you stuffed them in, but because a comprehensive treatment of the topic requires them.',
      '**Internal Linking as a Ranking Lever.** Every new piece of content should receive internal links from 3–5 relevant existing pages. The anchor text of those internal links is a strong topical signal. A page about "local SEO services" linked internally with the anchor "local SEO services" from multiple relevant pages reinforces that keyword association significantly.',
      "**Page Experience Signals.** Dwell time, scroll depth, and return-to-SERP rate (pogo-sticking) are all indirect ranking signals. Make your content genuinely engaging: use headers to make it scannable, include images and diagrams, write in short paragraphs (3–4 sentences maximum), and always end with a clear next step — whether that is a CTA, a related article, or a contact form.",
    ],
  },
  {
    title:
      "Google Ads vs SEO in 2025: When to Use Each (And Why You Need Both)",
    excerpt:
      "Paid search delivers instant traffic; SEO builds compounding organic assets. Here is our data-driven framework for deciding how to split your budget between the two.",
    category: "Paid Ads",
    readTime: "9 min read",
    date: "Jan 22, 2025",
    slug: "google-ads-vs-seo-2025",
    image: "/blog-ads-vs-seo.png",
    author: "Abdullah Babu",
    authorRole: "Founder & CEO",
    authorAvatar: "A",
    tags: ["Google Ads", "SEO", "PPC", "Digital Marketing Strategy"],
    body: [
      "The Google Ads vs SEO debate is one of the most common conversations we have with new clients. The short answer is: both work, and the best-performing digital marketing strategies use them together. But the allocation between the two should depend on your business stage, competitive landscape, and financial goals.",
      '**When Google Ads Wins.** Paid search is the right choice when you need immediate results. If you are launching a new product, entering a new market, testing messaging, or have a time-sensitive promotion, Google Ads delivers targeted traffic the same day you launch. For high-commercial-intent queries with clear ROI (e.g. "emergency plumber London"), PPC can be profitable immediately with the right bidding strategy.',
      "**When SEO Wins.** SEO wins on ROI over a 12+ month horizon. The cost per acquisition for organic traffic typically drops to 10–30% of paid search CPAs once a site achieves top rankings. Unlike paid ads that stop the moment you pause spending, organic rankings continue to deliver traffic indefinitely. For informational queries, local searches, and brand-building, SEO is substantially more cost-effective long-term.",
      "**The Combined Strategy That Outperforms Both.** Our most successful clients use Google Ads to capture high-value, high-intent commercial queries while simultaneously building organic authority for mid and upper-funnel content. Paid ads also provide invaluable keyword conversion data that informs SEO strategy — you know exactly which keywords drive sales before investing months of SEO effort.",
      "**A Practical Budget Framework.** For businesses in years 1–2, we recommend 60% paid, 40% SEO. The ads fund growth while SEO compounds. From year 2 onward, shift gradually to 40% paid, 60% SEO as organic rankings mature. By year 3–4, top-performing clients are running 20% paid (for competitive commercial terms only) and 80% organic.",
      "**The Hidden Cost of Going Ads-Only.** We regularly speak to businesses spending $10,000–$50,000/month on Google Ads with zero SEO investment. They are renting their audience. The moment they pause spend — for cash flow, a campaign underperforming, or a strategic pivot — traffic drops to near zero. An equivalent investment in SEO over the same period would have built an organic asset generating traffic permanently.",
      "**Conclusion.** Stop thinking about Google Ads and SEO as competitors for your budget. Think of them as tools with different time horizons. Ads for today's revenue; SEO for next year's. The brands that win long-term invest in both, intelligently, with clear KPIs for each channel.",
    ],
  },
  {
    title: "Local SEO in 2025: The Complete Guide to Dominating Your City",
    excerpt:
      "From Google Business Profile optimisation to local citations and review strategies — everything a brick-and-mortar business needs to own the local pack.",
    category: "Local SEO",
    readTime: "11 min read",
    date: "Jan 8, 2025",
    slug: "local-seo-guide-2025",
    image: "/blog-local-seo.png",
    author: "Priya Singh",
    authorRole: "Dev & Local SEO Lead",
    authorAvatar: "P",
    tags: ["Local SEO", "Google Business Profile", "Citations", "Reviews"],
    body: [
      "For local businesses — restaurants, law firms, clinics, contractors, retailers — local SEO is the highest-ROI digital marketing channel available. Ranking in the Google Maps 3-pack for your core service keywords delivers warm, high-intent leads at a fraction of paid advertising costs.",
      "**Google Business Profile is Your Most Important Asset.** Claiming, verifying, and fully optimising your GBP listing is step one. This means: correct NAP (Name, Address, Phone) consistent with your website; selecting the most specific primary and secondary categories; uploading 15–25 high-quality photos including exterior, interior, team, and products; enabling messaging; setting accurate hours including holidays; and posting GBP updates at least twice per month.",
      "**The Review Velocity Strategy.** Google's local ranking algorithm heavily weights review quantity, recency, and diversity. Businesses with more than 50 reviews and a 4.5+ rating consistently appear in the 3-pack for competitive terms. Build a systematic review request process: send a follow-up email or SMS to every customer within 48 hours of service, include a direct GBP review link, and train your team to mention reviews verbally.",
      "**Local Citations: NAP Consistency at Scale.** A local citation is any online mention of your business name, address, and phone number. Google cross-references your citations to verify your business legitimacy and location. The most important citation sources are Google (GBP), Yelp, Facebook, Apple Maps, Bing Places, TripAdvisor (for hospitality), and industry-specific directories. Ensure your NAP is 100% identical across all of them — even minor variations (St vs Street, Suite vs Ste) create trust signals inconsistency.",
      '**Localised On-Page SEO.** Your website needs location-specific pages if you serve multiple areas. Each page should target "[service] in [city]" with genuine, unique content — not a template with just the city name swapped. Include local landmarks, specific address schema markup, embedded Google Maps, and locally relevant content (local statistics, case studies, community involvement).',
      "**Local Link Building.** Earning links from local organisations — chambers of commerce, community newspapers, local event sponsorships, business associations — carries outsized weight for local rankings. A link from your local chamber of commerce website is worth more for local SEO than a DA 50 national publication link, because it confirms to Google that you are a legitimate, community-connected local business.",
      "**Tracking Local SEO Performance.** Use a local rank tracker (BrightLocal or Whitespark) to track your positions for core keywords across your target postcode/zip codes — not just your office location. Monitor GBP Insights for search queries, profile views, direction requests, and call clicks. Review these metrics monthly and adjust your strategy based on what is and is not working.",
    ],
  },
  {
    title:
      "Content Writing for SEO: How to Create Articles That Rank and Convert",
    excerpt:
      "Great SEO content is not about keyword density or word counts. Here is the framework our content team uses to write articles that rank on page 1 and drive enquiries.",
    category: "Content",
    readTime: "10 min read",
    date: "Dec 15, 2024",
    slug: "content-writing-for-seo",
    image: "/blog-content-writing.png",
    author: "Emma Clarke",
    authorRole: "Client Success & Content",
    authorAvatar: "E",
    tags: ["Content Writing", "SEO Content", "Copywriting", "Organic Growth"],
    body: [
      "Most SEO content fails for one of two reasons: it is written to please search engines without genuinely helping readers, or it is well-written but completely ignores how search engines evaluate content quality. The best content satisfies both audiences simultaneously.",
      '**Start With Search Intent, Not Keywords.** Before writing, Google your target keyword and spend 10 minutes reading the top 5 results. Ask: what is the user really trying to accomplish? Are they looking for a definition, a how-to guide, a comparison, or a direct product page? Your content format and depth must match that intent. An informational query ("how does link building work") should never be answered with a thinly-veiled sales page.',
      "**The Content Brief Framework.** Every piece of content our team produces starts with a structured brief: target keyword + 3–5 secondary keywords; content format (guide, listicle, comparison, case study); target word count based on average top 10 competitor length; key questions the article must answer (pulled from People Also Ask and competitor H2 headings); required images and schema type.",
      "**Writing for Scanners and Readers.** Research shows that 79% of web users scan content before deciding whether to read it. Structure your articles for both modes. Use a compelling H1, a summarising intro paragraph (answer the query directly in the first 100 words), descriptive H2/H3 subheadings, short paragraphs (2–4 sentences), bulleted lists for steps and features, and a clear conclusion with a CTA.",
      '**The E-E-A-T Content Signals.** In the post-Helpful Content Update world, Google rewards content that demonstrates first-hand experience. Include original data, screenshots, case study results, and specific examples wherever possible. Generic "top 10 tips" articles that could have been written by anyone — and were, probably by thousands of competing sites — are devalued. Specific, experience-backed content is rewarded.',
      "**Content Refresh Strategy.** Publishing new content is only half the job. Existing content decays in rankings as competitors publish fresher, more comprehensive articles. Audit your top 20 ranking pages every quarter. Update statistics, add new sections covering topics competitors have addressed, expand thin sections, and improve the intro — often just rewriting the first 200 words dramatically improves CTR and rankings.",
      "**Converting Organic Readers Into Leads.** Every piece of SEO content should have a clear conversion goal. Include a contextually relevant CTA mid-article and at the close. For service-based businesses, this means offering a free consultation, audit, or download. For e-commerce, it means links to the relevant product or category. The best SEO content generates leads around the clock — not just traffic.",
    ],
  },
  {
    title:
      "Web Development and SEO: Why Your Site Architecture Determines Your Rankings",
    excerpt:
      "How your site is built has a direct impact on how well it ranks. Here is what every business owner needs to know about technical architecture, Core Web Vitals, and performance.",
    category: "Web Development",
    readTime: "9 min read",
    date: "Nov 28, 2024",
    slug: "web-development-seo-architecture",
    image: "/blog-web-dev-seo.png",
    author: "Priya Singh",
    authorRole: "Dev Team Lead",
    authorAvatar: "P",
    tags: ["Web Development", "Core Web Vitals", "Site Speed", "Technical SEO"],
    body: [
      "Most business owners treat web development and SEO as separate disciplines handled by separate teams. This is one of the most expensive mistakes in digital marketing. The decisions made during site development — framework choice, URL structure, rendering method, image handling, and server configuration — have a profound and often permanent impact on SEO performance.",
      "**Framework Choice and Rendering.** Server-Side Rendering (SSR) frameworks like Next.js produce HTML that Googlebot can immediately crawl and index without running JavaScript. Single-Page Applications (SPAs) built with Create React App or pure Vue.js require JavaScript execution before content is visible — and while Google has improved its JS rendering capability, it remains slower and less reliable than SSR. For SEO, choose SSR or static generation (SSG) whenever possible.",
      "**URL Architecture is Permanent.** The URL structure you launch with is very difficult to change later without risking ranking losses during redirects. Design your URLs to be short, descriptive, and hierarchical. For e-commerce: /category/sub-category/product. For service businesses: /services/service-name. For content: /blog/article-slug. Avoid dynamic parameters in URLs wherever possible.",
      '**Core Web Vitals in 2025.** Google uses Core Web Vitals as a direct ranking factor. The three metrics that matter are: Largest Contentful Paint (LCP < 2.5s) — how fast your main content loads; Cumulative Layout Shift (CLS < 0.1) — how much your page layout jumps around during load; and Interaction to Next Paint (INP < 200ms) — how quickly the page responds to user interactions. Achieve all three "Good" thresholds and you gain a measurable ranking advantage, particularly in competitive SERPs.',
      "**Image Optimisation at the Dev Level.** Images are responsible for 60–80% of page weight on most sites. Build image optimisation into your development workflow: use WebP or AVIF format instead of JPEG/PNG; implement responsive images with srcset to serve correctly-sized images to each device; enable lazy loading for below-the-fold images; specify explicit width and height attributes to eliminate CLS; and use a CDN for global delivery.",
      '**Site Architecture and Crawl Efficiency.** Google allocates a "crawl budget" to each site based on its authority and server speed. Sites with clean, shallow architectures (no page more than 3 clicks from the homepage) are crawled more thoroughly and indexed faster. Eliminate paginated faceted navigation generating thousands of duplicate URLs. Implement proper canonicalisation. Build a clean XML sitemap that only includes indexable, valuable URLs.',
      "**Performance Monitoring.** Set up continuous performance monitoring using Lighthouse CI in your deployment pipeline so performance regressions are caught before they reach production. Review Google Search Console's Core Web Vitals report monthly. A site that was fast at launch can become slow within 12 months as plugins, scripts, and content accumulate — without a monitoring system, you will not notice until rankings drop.",
    ],
  },
];
