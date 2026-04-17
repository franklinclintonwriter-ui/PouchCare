/**
 * PouchCare OS — Production Seed Script
 * Seeds: Services + ServicePlans + Staff Members
 * Run inside pouchcare-api container: node /tmp/seed-services-staff.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────
function cuid() {
  return 'c' + crypto.randomBytes(11).toString('hex');
}
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── SERVICES DATA ─────────────────────────────────────────────────────────────
const SERVICES = [
  // ── SEO ───────────────────────────────────────────────────────────────────
  {
    name: 'SEO Audit & Strategy',
    category: 'SEO',
    basePriceUsd: 149,
    turnaroundDays: 5,
    featured: true,
    displayOrder: 1,
    icon: '🔍',
    shortDescription: 'Full technical & content audit with a 90-day action plan to dominate Google rankings.',
    fullDescription: 'Our SEO Audit covers 150+ ranking factors: crawl errors, Core Web Vitals, backlink toxicity, keyword gaps, competitor analysis, and a prioritised roadmap so your team knows exactly what to fix first.',
    metaTitle: 'SEO Audit & Strategy | PouchCare',
    metaDescription: 'Get a complete SEO audit covering technical issues, content gaps, and a 90-day action plan.',
    plans: [
      { name: 'Starter', priceUsd: 149, priceBdt: 16300, deliveryDays: 5, isPopular: false, displayOrder: 0, features: ['15-page crawl', 'Core Web Vitals report', 'Top-5 competitor gap', 'PDF summary'] },
      { name: 'Pro', priceUsd: 299, priceBdt: 32700, deliveryDays: 7, isPopular: true, displayOrder: 1, features: ['Unlimited pages', 'Technical SEO deep-dive', 'Backlink toxicity scan', 'Keyword opportunity matrix', '90-day roadmap', 'Zoom walkthrough'] },
      { name: 'Enterprise', priceUsd: 599, priceBdt: 65600, deliveryDays: 10, isPopular: false, displayOrder: 2, features: ['Everything in Pro', 'Quarterly re-audit', 'Dedicated SEO manager', 'Monthly progress report', 'Priority Slack support'] },
    ],
  },
  {
    name: 'On-Page SEO Optimization',
    category: 'SEO',
    basePriceUsd: 199,
    turnaroundDays: 7,
    featured: true,
    displayOrder: 2,
    icon: '📈',
    shortDescription: 'Keyword-targeted title tags, meta descriptions, headings, schema markup and internal linking.',
    fullDescription: 'We optimise each page for a primary keyword cluster: rewrite title & meta, restructure headings, add FAQ schema, fix canonical tags, compress images for LCP, and build internal links to boost page authority.',
    metaTitle: 'On-Page SEO Optimization | PouchCare',
    metaDescription: 'Expert on-page SEO optimization — titles, schema, images, and internal links for higher rankings.',
    plans: [
      { name: 'Starter (5 pages)', priceUsd: 199, priceBdt: 21800, deliveryDays: 7, isPopular: false, displayOrder: 0, features: ['5 pages optimised', 'Title & meta rewrite', 'H1–H3 restructure', 'Alt text fix', 'Schema markup'] },
      { name: 'Growth (15 pages)', priceUsd: 449, priceBdt: 49200, deliveryDays: 10, isPopular: true, displayOrder: 1, features: ['15 pages', 'All Starter features', 'Internal link mapping', 'Page speed recommendations', 'Before/after report'] },
      { name: 'Scale (30 pages)', priceUsd: 799, priceBdt: 87500, deliveryDays: 14, isPopular: false, displayOrder: 2, features: ['30 pages', 'All Growth features', 'Content gap additions', 'FAQ schema on every page', 'Competitor comparison'] },
    ],
  },
  {
    name: 'Link Building Campaign',
    category: 'SEO',
    basePriceUsd: 399,
    turnaroundDays: 30,
    featured: true,
    displayOrder: 3,
    icon: '🔗',
    shortDescription: 'High-DA white-hat backlinks from real editorial websites — 100% manual outreach.',
    fullDescription: 'Manual outreach to relevant DR40+ domains, guest posts, niche edits, and brand mentions. Every link is indexed within 30 days or replaced free. Includes a live Google Sheet tracker updated daily.',
    metaTitle: 'Link Building Campaign | PouchCare',
    metaDescription: 'White-hat link building with manual DR40+ outreach. All links tracked and guaranteed.',
    plans: [
      { name: 'Starter — 5 Links', priceUsd: 399, priceBdt: 43700, deliveryDays: 30, isPopular: false, displayOrder: 0, features: ['5 DR40+ backlinks', 'Manual outreach', 'Niche-relevant placements', 'Live tracker sheet', 'Link replacement guarantee'] },
      { name: 'Growth — 15 Links', priceUsd: 999, priceBdt: 109400, deliveryDays: 30, isPopular: true, displayOrder: 1, features: ['15 DR40+ backlinks', 'Mix of guest posts & niche edits', 'All Starter features', 'Monthly performance report'] },
      { name: 'Authority — 30 Links', priceUsd: 1799, priceBdt: 197000, deliveryDays: 30, isPopular: false, displayOrder: 2, features: ['30 DR50+ backlinks', 'DR60+ options available', 'Dedicated outreach manager', 'Competitor disavow report'] },
    ],
  },
  {
    name: 'Local SEO Package',
    category: 'SEO',
    basePriceUsd: 179,
    turnaroundDays: 10,
    featured: false,
    displayOrder: 4,
    icon: '📍',
    shortDescription: 'Google Business Profile optimisation, local citation building, and map-pack ranking.',
    fullDescription: 'We claim and optimise your GBP listing, build NAP-consistent citations on 50+ local directories, create geo-targeted landing pages, and set up review generation — everything to rank in the local 3-pack.',
    metaTitle: 'Local SEO Package | PouchCare',
    metaDescription: 'Rank in the Google Map Pack with local SEO — GBP optimisation, citations, and review strategy.',
    plans: [
      { name: 'Local Starter', priceUsd: 179, priceBdt: 19600, deliveryDays: 10, isPopular: false, displayOrder: 0, features: ['GBP optimisation', '30 citation submissions', 'Review request template', 'Competitor geo analysis'] },
      { name: 'Local Pro', priceUsd: 349, priceBdt: 38200, deliveryDays: 14, isPopular: true, displayOrder: 1, features: ['GBP + Bing Places', '60 citations', 'Geo-targeted landing page', 'Schema markup', 'Monthly ranking report'] },
    ],
  },

  // ── Web Development ────────────────────────────────────────────────────────
  {
    name: 'WordPress Website Development',
    category: 'Dev',
    basePriceUsd: 499,
    turnaroundDays: 14,
    featured: true,
    displayOrder: 5,
    icon: '🌐',
    shortDescription: 'Responsive, SEO-ready WordPress site built on a premium theme — live in 14 days.',
    fullDescription: 'We design and develop a fast, mobile-first WordPress site: custom theme setup, on-brand colour palette, up to 10 pages, contact form, Google Analytics, SSL, and speed optimisation to hit 90+ PageSpeed score.',
    metaTitle: 'WordPress Website Development | PouchCare',
    metaDescription: 'Professional WordPress website built in 14 days — responsive, SEO-ready, and blazing fast.',
    plans: [
      { name: 'Basic (5 pages)', priceUsd: 499, priceBdt: 54700, deliveryDays: 14, isPopular: false, displayOrder: 0, features: ['5 pages', 'Premium theme', 'Mobile responsive', 'Contact form', 'Basic SEO setup', 'SSL + hosting config'] },
      { name: 'Professional (10 pages)', priceUsd: 899, priceBdt: 98500, deliveryDays: 21, isPopular: true, displayOrder: 1, features: ['10 pages', 'Custom design', 'Blog setup', 'Social media integration', 'Newsletter opt-in', 'PageSpeed 90+', '3 revision rounds'] },
      { name: 'Premium (20 pages)', priceUsd: 1499, priceBdt: 164200, deliveryDays: 30, isPopular: false, displayOrder: 2, features: ['20 pages', 'Fully custom design', 'Multilingual ready', 'Advanced analytics', 'Priority support 6 months'] },
    ],
  },
  {
    name: 'E-Commerce Store (WooCommerce)',
    category: 'Dev',
    basePriceUsd: 799,
    turnaroundDays: 21,
    featured: true,
    displayOrder: 6,
    icon: '🛒',
    shortDescription: 'Full WooCommerce store with payment gateway, inventory, and SEO product pages.',
    fullDescription: 'Complete online store: product catalogue, cart & checkout, payment gateway (Stripe/PayPal/local), order management, tax rules, inventory, and optimised product pages with schema markup for Google Shopping.',
    metaTitle: 'E-Commerce Store Development | PouchCare',
    metaDescription: 'Launch your online store with WooCommerce — products, payments, and full SEO in 21 days.',
    plans: [
      { name: 'Store Starter (25 products)', priceUsd: 799, priceBdt: 87500, deliveryDays: 21, isPopular: false, displayOrder: 0, features: ['25 products', 'Payment gateway', 'Cart & checkout', 'Order management', 'Mobile responsive'] },
      { name: 'Store Pro (100 products)', priceUsd: 1499, priceBdt: 164200, deliveryDays: 30, isPopular: true, displayOrder: 1, features: ['100 products', 'All Starter features', 'Product filters & search', 'Coupon & discount system', 'Email order notifications', 'Google Shopping feed'] },
      { name: 'Store Enterprise', priceUsd: 2999, priceBdt: 328500, deliveryDays: 45, isPopular: false, displayOrder: 2, features: ['Unlimited products', 'Multi-currency', 'Subscription / memberships', 'Advanced inventory', 'Custom checkout flow', 'Dedicated dev support 3 months'] },
    ],
  },
  {
    name: 'Landing Page Design & Development',
    category: 'Dev',
    basePriceUsd: 299,
    turnaroundDays: 7,
    featured: false,
    displayOrder: 7,
    icon: '🚀',
    shortDescription: 'High-converting single-page landing page — A/B tested copy, CTA optimised.',
    fullDescription: 'A conversion-focused landing page with hero, benefits, social proof, FAQ, and CTA sections. Includes copywriting, custom illustrations or stock images, lead capture form, and Meta/Google pixel integration.',
    metaTitle: 'Landing Page Design & Development | PouchCare',
    metaDescription: 'High-converting landing page with copy, design, and pixel integration delivered in 7 days.',
    plans: [
      { name: 'Basic', priceUsd: 299, priceBdt: 32700, deliveryDays: 7, isPopular: false, displayOrder: 0, features: ['5 sections', 'Lead form', 'Mobile responsive', 'Basic analytics', '1 revision'] },
      { name: 'Pro', priceUsd: 549, priceBdt: 60100, deliveryDays: 10, isPopular: true, displayOrder: 1, features: ['10 sections', 'Copywriting included', 'A/B test setup', 'Pixel integration', 'Chat widget', '3 revisions'] },
    ],
  },
  {
    name: 'Web-to-APK Conversion',
    category: 'Dev',
    basePriceUsd: 49,
    turnaroundDays: 2,
    featured: false,
    displayOrder: 8,
    icon: '📱',
    shortDescription: 'Turn any website into a publishable Android APK in 48 hours.',
    fullDescription: 'We wrap your website in a native Android WebView container, configure splash screen, app icon, offline handling, push notifications (optional), and deliver a signed APK ready for Play Store or direct distribution.',
    metaTitle: 'Web-to-APK Conversion | PouchCare',
    metaDescription: 'Convert your website to an Android APK in 48 hours. Signed, splash screen, push notifications.',
    plans: [
      { name: 'Free (Demo)', priceUsd: 0, priceBdt: 0, deliveryDays: 2, isPopular: false, displayOrder: 0, features: ['Basic WebView wrap', 'App icon', 'Splash screen', 'Unsigned APK', '5 MB limit'] },
      { name: 'Standard', priceUsd: 49, priceBdt: 5400, deliveryDays: 2, isPopular: true, displayOrder: 1, features: ['Signed APK', 'Custom icon & splash', 'Push notifications', 'Offline page', 'Play Store ready'] },
      { name: 'Pro', priceUsd: 99, priceBdt: 10800, deliveryDays: 2, isPopular: false, displayOrder: 2, features: ['All Standard features', 'AdMob integration', 'Deep links', 'In-app browser', 'Source code included'] },
    ],
  },

  // ── Design ─────────────────────────────────────────────────────────────────
  {
    name: 'Logo & Brand Identity',
    category: 'Design',
    basePriceUsd: 149,
    turnaroundDays: 5,
    featured: true,
    displayOrder: 9,
    icon: '🎨',
    shortDescription: 'Professional logo design with a complete brand kit — colours, fonts, usage guide.',
    fullDescription: 'We create 3 unique logo concepts, refine your favourite, and deliver AI/SVG/PNG/PDF files plus a brand guide covering primary & secondary colours, typography, spacing, and do/don\'t usage rules.',
    metaTitle: 'Logo & Brand Identity Design | PouchCare',
    metaDescription: 'Professional logo design with brand kit — SVG, PNG, AI files and usage guide delivered in 5 days.',
    plans: [
      { name: 'Logo Only', priceUsd: 149, priceBdt: 16300, deliveryDays: 5, isPopular: false, displayOrder: 0, features: ['3 initial concepts', 'Unlimited revisions', 'AI + SVG + PNG + PDF', 'Transparent background'] },
      { name: 'Brand Kit', priceUsd: 349, priceBdt: 38200, deliveryDays: 7, isPopular: true, displayOrder: 1, features: ['Logo design', 'Color palette', 'Typography selection', 'Business card design', 'Social media kit', 'Brand style guide PDF'] },
      { name: 'Full Brand Identity', priceUsd: 699, priceBdt: 76600, deliveryDays: 14, isPopular: false, displayOrder: 2, features: ['Everything in Brand Kit', 'Letterhead & email signature', 'Pitch deck template', 'Icon set (20 icons)', 'Brand book'] },
    ],
  },
  {
    name: 'UI/UX Design',
    category: 'Design',
    basePriceUsd: 399,
    turnaroundDays: 10,
    featured: false,
    displayOrder: 10,
    icon: '🖥️',
    shortDescription: 'Figma wireframes and high-fidelity mockups for web apps, SaaS, and mobile.',
    fullDescription: 'End-to-end UI/UX: user research summary, information architecture, low-fi wireframes, clickable Figma prototype, and final high-fidelity screens handed off with a developer spec sheet and design tokens.',
    metaTitle: 'UI/UX Design Services | PouchCare',
    metaDescription: 'Figma wireframes, prototypes, and high-fidelity UI design for web apps and mobile.',
    plans: [
      { name: 'Wireframes (5 screens)', priceUsd: 399, priceBdt: 43700, deliveryDays: 10, isPopular: false, displayOrder: 0, features: ['5 key screens', 'Wireframe + hi-fi', 'Clickable prototype', 'Design system basics'] },
      { name: 'Full Design (15 screens)', priceUsd: 899, priceBdt: 98500, deliveryDays: 21, isPopular: true, displayOrder: 1, features: ['15 screens', 'UX research summary', 'Interactive Figma prototype', 'Full design system', 'Dev hand-off spec', '3 revisions'] },
    ],
  },

  // ── Content ────────────────────────────────────────────────────────────────
  {
    name: 'Blog Content Writing',
    category: 'Content',
    basePriceUsd: 79,
    turnaroundDays: 3,
    featured: false,
    displayOrder: 11,
    icon: '✍️',
    shortDescription: 'SEO-optimised blog articles written by native English experts — 100% Copyscape clean.',
    fullDescription: 'Human-written, Google E-E-A-T compliant articles: keyword research, optimised H-structure, internal link suggestions, meta description, and a royalty-free featured image. All content passes Copyscape and AI detection.',
    metaTitle: 'SEO Blog Content Writing | PouchCare',
    metaDescription: 'Expert SEO blog writing — human-written, E-E-A-T compliant, Copyscape clean.',
    plans: [
      { name: '1 Article (1,000 words)', priceUsd: 79, priceBdt: 8700, deliveryDays: 3, isPopular: false, displayOrder: 0, features: ['1,000+ words', 'Keyword research', 'Meta description', 'Royalty-free image', 'Copyscape pass'] },
      { name: '5 Articles (1,500 words)', priceUsd: 349, priceBdt: 38200, deliveryDays: 7, isPopular: true, displayOrder: 1, features: ['5 × 1,500+ words', 'Topic cluster planning', 'Internal link map', 'Structured H-tags', 'Content calendar'] },
      { name: '10 Articles (2,000 words)', priceUsd: 599, priceBdt: 65600, deliveryDays: 14, isPopular: false, displayOrder: 2, features: ['10 × 2,000+ words', 'All Growth features', 'Schema FAQ section', 'Priority delivery'] },
    ],
  },
  {
    name: 'Website Copywriting',
    category: 'Content',
    basePriceUsd: 199,
    turnaroundDays: 5,
    featured: false,
    displayOrder: 12,
    icon: '📝',
    shortDescription: 'Conversion-focused website copy: homepage, about, services, and landing pages.',
    fullDescription: 'Persuasive, brand-aligned copy for your core pages. We research your audience, study competitors, and write compelling hooks, benefit-led body copy, and strong CTAs that guide visitors to convert.',
    metaTitle: 'Website Copywriting | PouchCare',
    metaDescription: 'Conversion-focused website copy for homepage, about, services, and landing pages.',
    plans: [
      { name: '3 Pages', priceUsd: 199, priceBdt: 21800, deliveryDays: 5, isPopular: false, displayOrder: 0, features: ['3 pages', 'Tone of voice guide', 'CTA optimisation', '1 revision round'] },
      { name: '7 Pages', priceUsd: 449, priceBdt: 49200, deliveryDays: 10, isPopular: true, displayOrder: 1, features: ['7 pages', 'All Basic features', 'SEO meta copy', 'Email sequence (3)', '2 revision rounds'] },
    ],
  },

  // ── Ads ────────────────────────────────────────────────────────────────────
  {
    name: 'Google Ads Management',
    category: 'Ads',
    basePriceUsd: 249,
    turnaroundDays: 3,
    featured: true,
    displayOrder: 13,
    icon: '📊',
    shortDescription: 'Full Google Ads setup and monthly management — Search, Display, Shopping & Performance Max.',
    fullDescription: 'We handle everything: keyword research, negative list, ad copy, bid strategy, conversion tracking, A/B testing, and monthly reporting. Managed ad spend up to $5k/month included in base price.',
    metaTitle: 'Google Ads Management | PouchCare',
    metaDescription: 'Expert Google Ads management — Search, Shopping, and PMax campaigns with monthly reporting.',
    plans: [
      { name: 'Starter (ad spend up to $1k)', priceUsd: 249, priceBdt: 27300, deliveryDays: 3, isPopular: false, displayOrder: 0, features: ['Campaign setup', 'Keyword research', 'Ad copy (3 variants)', 'Conversion tracking', 'Monthly report'] },
      { name: 'Growth (ad spend up to $5k)', priceUsd: 499, priceBdt: 54700, deliveryDays: 3, isPopular: true, displayOrder: 1, features: ['All Starter features', 'Shopping / PMax campaigns', 'Remarketing', 'A/B ad testing', 'Bi-weekly calls'] },
      { name: 'Scale (ad spend $5k+)', priceUsd: 999, priceBdt: 109400, deliveryDays: 3, isPopular: false, displayOrder: 2, features: ['All Growth features', 'Dedicated account manager', 'Custom dashboards', 'Weekly reporting', 'YouTube ads'] },
    ],
  },
  {
    name: 'Social Media Marketing',
    category: 'Ads',
    basePriceUsd: 199,
    turnaroundDays: 3,
    featured: false,
    displayOrder: 14,
    icon: '📣',
    shortDescription: 'Meta, TikTok & LinkedIn ad campaigns with creative design and daily optimisation.',
    fullDescription: 'Full-funnel social media advertising: audience research, creative production (static + video), ad launch, daily bid optimisation, pixel setup, lookalike audiences, and weekly performance reports.',
    metaTitle: 'Social Media Marketing | PouchCare',
    metaDescription: 'Meta, TikTok, and LinkedIn paid ads with creative design and daily optimisation.',
    plans: [
      { name: 'One Platform', priceUsd: 199, priceBdt: 21800, deliveryDays: 3, isPopular: false, displayOrder: 0, features: ['1 platform (Meta/TikTok/LinkedIn)', 'Audience setup', '3 ad creatives', 'Pixel installation', 'Monthly report'] },
      { name: 'Multi-Platform', priceUsd: 399, priceBdt: 43700, deliveryDays: 3, isPopular: true, displayOrder: 1, features: ['Up to 3 platforms', 'All One Platform features', 'Video ad production', 'Retargeting campaigns', 'Weekly performance calls'] },
    ],
  },

  // ── Hosting ────────────────────────────────────────────────────────────────
  {
    name: 'Managed WordPress Hosting',
    category: 'Hosting',
    basePriceUsd: 119,
    turnaroundDays: 1,
    featured: true,
    displayOrder: 15,
    icon: '☁️',
    shortDescription: 'Lightning-fast managed WordPress hosting with daily backups, SSL, and 24/7 support.',
    fullDescription: 'Enterprise-grade managed hosting on NVMe SSD servers: free SSL, daily backups, one-click staging, malware scanning, CDN included, and 24/7 support. 99.9% uptime SLA.',
    metaTitle: 'Managed WordPress Hosting | PouchCare',
    metaDescription: 'Blazing-fast managed WordPress hosting with SSL, CDN, daily backups, and 99.9% uptime.',
    plans: [
      { name: 'Starter (1 site)', priceUsd: 59, priceBdt: 6500, deliveryDays: 1, isPopular: false, displayOrder: 0, features: ['1 WordPress site', '10 GB NVMe SSD', 'Free SSL', 'Daily backups', 'CDN included', '99.9% uptime'] },
      { name: 'Business (5 sites)', priceUsd: 119, priceBdt: 13000, deliveryDays: 1, isPopular: true, displayOrder: 1, features: ['5 sites', '30 GB NVMe SSD', 'All Starter features', 'Staging environment', 'Malware scanning', 'Priority support'] },
      { name: 'Agency (Unlimited)', priceUsd: 229, priceBdt: 25100, deliveryDays: 1, isPopular: false, displayOrder: 2, features: ['Unlimited sites', '100 GB NVMe SSD', 'All Business features', 'White-label dashboard', 'Reseller panel', 'Dedicated IP'] },
    ],
  },
  {
    name: 'Domain Registration & Management',
    category: 'Hosting',
    basePriceUsd: 12.99,
    turnaroundDays: 1,
    featured: false,
    displayOrder: 16,
    icon: '🌍',
    shortDescription: 'Register .com, .net, .io, .org and 100+ TLDs with free WHOIS privacy.',
    fullDescription: 'Register, transfer, or renew domain names at competitive prices with free WHOIS privacy, DNS management, domain forwarding, and email forwarding included. All domains managed from one dashboard.',
    metaTitle: 'Domain Registration | PouchCare',
    metaDescription: 'Register .com, .net, .io, and 100+ TLDs with free WHOIS privacy and DNS management.',
    plans: [
      { name: '.com (1 year)', priceUsd: 12.99, priceBdt: 1420, deliveryDays: 1, isPopular: true, displayOrder: 0, features: ['Free WHOIS privacy', 'DNS management', 'Domain forwarding', 'Email forwarding', 'Auto-renewal'] },
      { name: '.com (2 years)', priceUsd: 24.99, priceBdt: 2740, deliveryDays: 1, isPopular: false, displayOrder: 1, features: ['All 1-year features', 'Best value', 'Price locked for 2 years'] },
    ],
  },
];

// ── STAFF DATA ────────────────────────────────────────────────────────────────
const STAFF_PASSWORD = 'Staff@2026!';

const STAFF = [
  {
    name: 'Abdullah Al Mamun',
    email: 'comd@pouchcare.com',
    systemRole: 'CO_MD',
    branch: 'HQ',
    jobRole: 'Co-Managing Director',
    primarySkill: 'Business Strategy',
    skillLevel: 'Expert',
    employmentType: 'Full-Time',
    salary: 2500,
    country: 'Bangladesh',
    phone: '+8801711000001',
    joinDate: new Date('2023-01-01'),
    yearsExperience: 8,
    linkedinUrl: 'https://linkedin.com/in/abdullahalmamun',
    certifications: 'MBA, Google Analytics Certified',
    status: 'Active',
  },
  {
    name: 'Fatima Sultana',
    email: 'ops@pouchcare.com',
    systemRole: 'OP_MANAGER',
    branch: 'HQ',
    jobRole: 'Operations Manager',
    primarySkill: 'Project Management',
    skillLevel: 'Senior',
    employmentType: 'Full-Time',
    salary: 1800,
    country: 'Bangladesh',
    phone: '+8801711000002',
    joinDate: new Date('2023-03-15'),
    yearsExperience: 6,
    certifications: 'PMP Certified',
    status: 'Active',
  },
  {
    name: 'Rakibul Hasan',
    email: 'hr@pouchcare.com',
    systemRole: 'HR_MANAGER',
    branch: 'HQ',
    jobRole: 'HR Manager',
    primarySkill: 'Human Resources',
    skillLevel: 'Senior',
    employmentType: 'Full-Time',
    salary: 1600,
    country: 'Bangladesh',
    phone: '+8801711000003',
    joinDate: new Date('2023-04-01'),
    yearsExperience: 5,
    certifications: 'SHRM Certified',
    status: 'Active',
  },
  {
    name: 'Nasrin Akhter',
    email: 'branch.manager@pouchcare.com',
    systemRole: 'BRANCH_MANAGER',
    branch: 'Dhaka',
    jobRole: 'Branch Manager — Dhaka',
    primarySkill: 'Team Leadership',
    skillLevel: 'Senior',
    employmentType: 'Full-Time',
    salary: 1400,
    country: 'Bangladesh',
    phone: '+8801711000004',
    joinDate: new Date('2023-06-01'),
    yearsExperience: 5,
    status: 'Active',
  },
  {
    name: 'Mostofa Kamal',
    email: 'lead.dev@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'Lead WordPress Developer',
    primarySkill: 'WordPress Development',
    skillLevel: 'Expert',
    secondarySkills: 'PHP, JavaScript, WooCommerce',
    toolsKnown: 'VS Code, Git, WP Engine, Elementor',
    employmentType: 'Full-Time',
    salary: 1200,
    country: 'Bangladesh',
    phone: '+8801711000005',
    joinDate: new Date('2023-05-10'),
    yearsExperience: 7,
    githubUrl: 'https://github.com/mostofa-kamal',
    certifications: 'WordPress Certified Developer',
    status: 'Active',
  },
  {
    name: 'Sumaiya Islam',
    email: 'seo.lead@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'SEO Team Lead',
    primarySkill: 'SEO',
    skillLevel: 'Expert',
    secondarySkills: 'Content Strategy, Link Building, Technical SEO',
    toolsKnown: 'Ahrefs, SEMrush, Screaming Frog, Search Console',
    employmentType: 'Full-Time',
    salary: 1100,
    country: 'Bangladesh',
    phone: '+8801711000006',
    joinDate: new Date('2023-07-01'),
    yearsExperience: 6,
    certifications: 'Google Search Ads, HubSpot Content Marketing',
    status: 'Active',
  },
  {
    name: 'Arif Hossain',
    email: 'dev2@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'Full Stack Developer',
    primarySkill: 'React / Node.js',
    skillLevel: 'Senior',
    secondarySkills: 'Next.js, TypeScript, PostgreSQL, Docker',
    toolsKnown: 'VS Code, GitHub, Vercel, Cloudflare',
    employmentType: 'Full-Time',
    salary: 1150,
    country: 'Bangladesh',
    phone: '+8801711000007',
    joinDate: new Date('2023-09-01'),
    yearsExperience: 5,
    githubUrl: 'https://github.com/arif-hossain',
    status: 'Active',
  },
  {
    name: 'Nusrat Jahan',
    email: 'designer@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'UI/UX Designer',
    primarySkill: 'Figma Design',
    skillLevel: 'Senior',
    secondarySkills: 'Adobe XD, Illustrator, Photoshop, Branding',
    toolsKnown: 'Figma, Adobe Suite, Zeplin',
    employmentType: 'Full-Time',
    salary: 1000,
    country: 'Bangladesh',
    phone: '+8801711000008',
    joinDate: new Date('2023-08-15'),
    yearsExperience: 4,
    portfolioUrl: 'https://behance.net/nusrat-jahan',
    certifications: 'Google UX Design Certificate',
    status: 'Active',
  },
  {
    name: 'Sabbir Ahmed',
    email: 'content.lead@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'Content Lead',
    primarySkill: 'Content Writing',
    skillLevel: 'Senior',
    secondarySkills: 'Copywriting, SEO Writing, Email Marketing',
    toolsKnown: 'Surfer SEO, Grammarly, Canva, Mailchimp',
    employmentType: 'Full-Time',
    salary: 950,
    country: 'Bangladesh',
    phone: '+8801711000009',
    joinDate: new Date('2023-10-01'),
    yearsExperience: 4,
    certifications: 'HubSpot Content Marketing, Copywriting Bootcamp',
    status: 'Active',
  },
  {
    name: 'Tania Khatun',
    email: 'ads.manager@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'Paid Ads Manager',
    primarySkill: 'Google Ads',
    skillLevel: 'Senior',
    secondarySkills: 'Meta Ads, TikTok Ads, LinkedIn Ads',
    toolsKnown: 'Google Ads, Meta Business Suite, Google Analytics 4',
    employmentType: 'Full-Time',
    salary: 1050,
    country: 'Bangladesh',
    phone: '+8801711000010',
    joinDate: new Date('2023-11-01'),
    yearsExperience: 5,
    certifications: 'Google Ads Certified, Meta Blueprint',
    status: 'Active',
  },
  {
    name: 'Karim Uddin',
    email: 'seo2@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'Dhaka',
    jobRole: 'SEO Specialist',
    primarySkill: 'On-Page SEO',
    skillLevel: 'Mid-Level',
    secondarySkills: 'Technical SEO, Content SEO',
    toolsKnown: 'Ahrefs, Screaming Frog, Yoast SEO',
    employmentType: 'Full-Time',
    salary: 750,
    country: 'Bangladesh',
    phone: '+8801711000011',
    joinDate: new Date('2024-01-15'),
    yearsExperience: 3,
    status: 'Active',
  },
  {
    name: 'Shapla Begum',
    email: 'dev3@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'HQ',
    jobRole: 'Frontend Developer',
    primarySkill: 'React.js',
    skillLevel: 'Mid-Level',
    secondarySkills: 'Tailwind CSS, TypeScript, Vue.js',
    toolsKnown: 'VS Code, GitHub, Figma to Code',
    employmentType: 'Full-Time',
    salary: 850,
    country: 'Bangladesh',
    phone: '+8801711000012',
    joinDate: new Date('2024-02-01'),
    yearsExperience: 3,
    githubUrl: 'https://github.com/shapla-begum',
    status: 'Active',
  },
  {
    name: 'Rahim Chowdhury',
    email: 'content2@pouchcare.com',
    systemRole: 'STAFF',
    branch: 'Dhaka',
    jobRole: 'Content Writer',
    primarySkill: 'Blog Writing',
    skillLevel: 'Mid-Level',
    secondarySkills: 'Social Media Copy, Product Descriptions',
    toolsKnown: 'Surfer SEO, Grammarly, WordPress',
    employmentType: 'Full-Time',
    salary: 650,
    country: 'Bangladesh',
    phone: '+8801711000013',
    joinDate: new Date('2024-03-01'),
    yearsExperience: 3,
    status: 'Active',
  },
  {
    name: 'Limon Das',
    email: 'dev.intern@pouchcare.com',
    systemRole: 'INTERN',
    branch: 'HQ',
    jobRole: 'Development Intern',
    primarySkill: 'WordPress',
    skillLevel: 'Junior',
    secondarySkills: 'HTML, CSS, JavaScript',
    toolsKnown: 'VS Code, Elementor, Git basics',
    employmentType: 'Internship',
    salary: 200,
    country: 'Bangladesh',
    phone: '+8801711000014',
    joinDate: new Date('2024-04-01'),
    yearsExperience: 0.5,
    status: 'Active',
  },
  {
    name: 'Mitu Roy',
    email: 'design.intern@pouchcare.com',
    systemRole: 'INTERN',
    branch: 'HQ',
    jobRole: 'Design Intern',
    primarySkill: 'Graphic Design',
    skillLevel: 'Junior',
    secondarySkills: 'Canva, Basic Figma',
    toolsKnown: 'Canva, Figma, Adobe Express',
    employmentType: 'Internship',
    salary: 200,
    country: 'Bangladesh',
    phone: '+8801711000015',
    joinDate: new Date('2024-04-10'),
    yearsExperience: 0.5,
    status: 'Active',
  },
];

// ── MAIN SEED FUNCTION ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 PouchCare OS — Seeding services and staff...\n');

  // ── 1. Seed Services ────────────────────────────────────────────────────────
  let servicesCreated = 0;
  let plansCreated = 0;

  for (const s of SERVICES) {
    const { plans, ...serviceData } = s;
    const serviceSlug = slug(serviceData.name);

    // Upsert service
    const service = await prisma.service.upsert({
      where: { slug: serviceSlug },
      update: {
        name: serviceData.name,
        category: serviceData.category,
        basePriceUsd: serviceData.basePriceUsd,
        turnaroundDays: serviceData.turnaroundDays,
        featured: serviceData.featured,
        displayOrder: serviceData.displayOrder,
        icon: serviceData.icon,
        shortDescription: serviceData.shortDescription,
        fullDescription: serviceData.fullDescription,
        metaTitle: serviceData.metaTitle,
        metaDescription: serviceData.metaDescription,
        status: 'Active',
      },
      create: {
        id: cuid(),
        slug: serviceSlug,
        name: serviceData.name,
        category: serviceData.category,
        basePriceUsd: serviceData.basePriceUsd,
        turnaroundDays: serviceData.turnaroundDays,
        featured: serviceData.featured,
        displayOrder: serviceData.displayOrder,
        icon: serviceData.icon,
        shortDescription: serviceData.shortDescription,
        fullDescription: serviceData.fullDescription,
        metaTitle: serviceData.metaTitle,
        metaDescription: serviceData.metaDescription,
        status: 'Active',
      },
    });
    servicesCreated++;

    // Upsert plans
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      const existing = await prisma.servicePlan.findFirst({
        where: { serviceId: service.id, name: p.name },
      });
      if (existing) {
        await prisma.servicePlan.update({
          where: { id: existing.id },
          data: { priceUsd: p.priceUsd, priceBdt: p.priceBdt, deliveryDays: p.deliveryDays, features: p.features, isPopular: p.isPopular, displayOrder: p.displayOrder },
        });
      } else {
        await prisma.servicePlan.create({
          data: {
            id: cuid(),
            serviceId: service.id,
            name: p.name,
            priceUsd: p.priceUsd,
            priceBdt: p.priceBdt,
            deliveryDays: p.deliveryDays,
            features: p.features,
            isPopular: p.isPopular,
            displayOrder: p.displayOrder,
          },
        });
        plansCreated++;
      }
    }
    console.log(`  ✅ Service: ${serviceData.name} (${plans.length} plans)`);
  }

  // ── 2. Seed Branches ────────────────────────────────────────────────────────
  const branches = [
    { name: 'HQ', country: 'Bangladesh', city: 'Dhaka', type: 'Headquarters', status: 'Active', email: 'hq@pouchcare.com', phone: '+8801711000000' },
    { name: 'Dhaka', country: 'Bangladesh', city: 'Dhaka', type: 'Branch', status: 'Active', email: 'dhaka@pouchcare.com' },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({ where: { name: b.name }, update: b, create: { id: cuid(), ...b } });
  }
  console.log(`\n  ✅ Branches: HQ, Dhaka`);

  // ── 3. Seed Staff Members ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(STAFF_PASSWORD, 12);
  let staffCreated = 0;
  let staffSkipped = 0;

  for (const staff of STAFF) {
    const existing = await prisma.staffMember.findUnique({ where: { email: staff.email } });
    if (existing) {
      // Update existing staff (don't overwrite password/role)
      await prisma.staffMember.update({
        where: { email: staff.email },
        data: {
          name: staff.name,
          branch: staff.branch,
          jobRole: staff.jobRole,
          primarySkill: staff.primarySkill,
          skillLevel: staff.skillLevel,
          secondarySkills: staff.secondarySkills,
          toolsKnown: staff.toolsKnown,
          employmentType: staff.employmentType,
          salary: staff.salary,
          country: staff.country,
          phone: staff.phone,
          joinDate: staff.joinDate,
          yearsExperience: staff.yearsExperience,
          portfolioUrl: staff.portfolioUrl,
          linkedinUrl: staff.linkedinUrl,
          githubUrl: staff.githubUrl,
          certifications: staff.certifications,
          status: staff.status,
          updatedAt: new Date(),
        },
      });
      staffSkipped++;
      console.log(`  🔄 Staff (updated): ${staff.name} — ${staff.jobRole}`);
    } else {
      await prisma.staffMember.create({
        data: {
          id: cuid(),
          name: staff.name,
          email: staff.email,
          passwordHash,
          systemRole: staff.systemRole,
          branch: staff.branch,
          jobRole: staff.jobRole,
          primarySkill: staff.primarySkill,
          skillLevel: staff.skillLevel,
          secondarySkills: staff.secondarySkills,
          toolsKnown: staff.toolsKnown,
          employmentType: staff.employmentType,
          salary: staff.salary,
          country: staff.country,
          phone: staff.phone,
          joinDate: staff.joinDate,
          yearsExperience: staff.yearsExperience,
          portfolioUrl: staff.portfolioUrl,
          linkedinUrl: staff.linkedinUrl,
          githubUrl: staff.githubUrl,
          certifications: staff.certifications,
          status: staff.status,
          updatedAt: new Date(),
        },
      });
      staffCreated++;
      console.log(`  ✅ Staff (created): ${staff.name} — ${staff.jobRole}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🎉 Done!`);
  console.log(`     Services created/updated : ${servicesCreated}`);
  console.log(`     Service plans created    : ${plansCreated}`);
  console.log(`     Staff created            : ${staffCreated}`);
  console.log(`     Staff updated            : ${staffSkipped}`);
  console.log(`\n  🔑 Default staff password   : ${STAFF_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
