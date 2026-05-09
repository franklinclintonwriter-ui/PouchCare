# PouchCare Frontend Implementation Plan

> **Product**: PouchCare — All-in-One WordPress Theme and Builder Toolkit
> **Stack**: React (JSX) + Tailwind CSS + React Router
> **Output**: Deployable multi-page project
> **Pages**: Landing Page, Templates Gallery, Pricing, Documentation/Blog

---

## 1. DESIGN SYSTEM — Extracted from Images

### 1.1 Color Palette

| Token                  | Hex         | Usage                                              |
|------------------------|-------------|-----------------------------------------------------|
| `--primary-blue`       | `#0A7AFF`   | Primary buttons, links, nav active states            |
| `--primary-blue-dark`  | `#0062D6`   | Button hover, headings emphasis                      |
| `--primary-blue-deeper`| `#003F8A`   | Footer background, deep sections                    |
| `--accent-cyan`        | `#00C6FF`   | Logo gradient end, icon accents, decorative lines    |
| `--accent-gold`        | `#FFB800`   | Key/lock icon accent, highlight dots on logo         |
| `--accent-orange`      | `#FF8C00`   | CTA secondary, star ratings                          |
| `--bg-white`           | `#FFFFFF`   | Main page background                                 |
| `--bg-light-gray`      | `#F5F7FA`   | Alternating sections background                      |
| `--bg-light-blue`      | `#EBF4FF`   | Feature cards hover, subtle highlights               |
| `--bg-hero-gradient`   | `linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #F0F8FF 100%)` | Hero section background |
| `--text-primary`       | `#1A1A2E`   | Main headings, body text                             |
| `--text-secondary`     | `#6B7280`   | Descriptions, secondary text                         |
| `--text-muted`         | `#9CA3AF`   | Placeholders, captions                               |
| `--border-light`       | `#E5E7EB`   | Card borders, dividers                               |
| `--cta-banner-blue`    | `#0A7AFF`   | "Ready to Build Something Amazing?" banner           |
| `--footer-bg`          | `#0D1B3E`   | Dark navy footer                                     |
| `--footer-text`        | `#CBD5E1`   | Footer body text                                     |
| `--shadow-card`        | `0 4px 20px rgba(10, 122, 255, 0.08)` | Card elevation                |
| `--shadow-hover`       | `0 8px 32px rgba(10, 122, 255, 0.15)` | Card hover elevation          |

### 1.2 Logo Specifications

The PouchCare logo is a stylized "PC" monogram with the following characteristics:
- **Shape**: Rounded square container with soft corners (~16px radius)
- **Icon**: Interlocked "P" and "C" letters in white on blue gradient background
- **Gradient**: Left-to-right from `#0A7AFF` to `#00C6FF`
- **Circuit/Tech detail**: Small circuit-board-style lines extending from the letters with dot terminals
- **Key accent**: A small golden/yellow (`#FFB800`) dot on the circuit connector — represents "unlocking" web potential
- **Sizes**: Favicon (32px), Nav logo (40px with text), Feature icon (48px)
- **Logo text**: "PouchCare" set in a bold sans-serif, blue color, placed right of the icon

### 1.3 Typography

| Role             | Font Family                        | Weight  | Size       |
|------------------|------------------------------------|---------|------------|
| Hero Heading     | `"Plus Jakarta Sans", sans-serif`  | 800     | 48px / 3rem |
| Section Heading  | `"Plus Jakarta Sans", sans-serif`  | 700     | 32px / 2rem |
| Card Title       | `"Plus Jakarta Sans", sans-serif`  | 600     | 18px / 1.125rem |
| Body Text        | `"Inter", sans-serif`              | 400     | 16px / 1rem |
| Small/Caption    | `"Inter", sans-serif`              | 400     | 14px / 0.875rem |
| Button Label     | `"Inter", sans-serif`              | 600     | 15px / 0.9375rem |
| Nav Links        | `"Inter", sans-serif`              | 500     | 15px / 0.9375rem |

**Note**: Plus Jakarta Sans gives a modern, geometric feel that matches the tech/toolkit branding. Inter serves as the clean workhorse for body and UI text.

### 1.4 Spacing & Grid

- **Container max-width**: `1280px`, centered with `auto` margins
- **Section padding**: `80px` vertical (`py-20`), `24px` horizontal on mobile
- **Card gap**: `24px` (`gap-6`)
- **Feature grid**: 4 columns on desktop, 2 on tablet, 1 on mobile
- **Border radius**: Cards `12px`, Buttons `8px`, Logo `16px`, Input fields `8px`
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

### 1.5 Visual Effects & Patterns

- **Hero background**: Subtle circuit-board line pattern in light blue (#EBF4FF) overlaid on white — thin geometric connector lines with small dots at intersections, very low opacity (~0.1)
- **Tech decoration**: Abstract flowing blue gradient shapes behind the hero logo (top-right of hero section)
- **Card hover**: Gentle lift with box-shadow expansion + top-border color accent (blue line on top of card)
- **Button style**: Solid fill primary (`#0A7AFF`, white text, 8px radius), outline secondary (blue border, blue text, transparent bg)
- **Section dividers**: No hard lines — sections separated by background color alternation (white → light gray → white)

---

## 2. COMPONENT ARCHITECTURE

### 2.1 Layout Components

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              # Fixed top nav with logo, links, CTA buttons
│   │   ├── Footer.jsx              # Dark navy footer with columns + copyright
│   │   ├── Container.jsx           # Max-width wrapper (1280px)
│   │   └── Section.jsx             # Reusable section with optional bg color
│   │
│   ├── ui/
│   │   ├── Button.jsx              # Primary / Secondary / Ghost variants
│   │   ├── Card.jsx                # Elevated card with hover effects
│   │   ├── Badge.jsx               # Small label chips (e.g., "New", "Popular")
│   │   ├── Input.jsx               # Text input with icon support
│   │   ├── Avatar.jsx              # Circular avatar for testimonials
│   │   ├── StarRating.jsx          # 5-star display component
│   │   ├── IconBox.jsx             # Rounded icon container for feature icons
│   │   └── Logo.jsx                # PouchCare logo (SVG) + text
│   │
│   ├── sections/
│   │   ├── Hero.jsx                # Hero with heading, subtext, 2 CTAs, stats bar, logo graphic
│   │   ├── Features.jsx            # 4-column feature cards with icons
│   │   ├── Testimonial.jsx         # Quote card with avatar, name, role, rating
│   │   ├── Partners.jsx            # Logo bar (Spotify, Airbnb, Coinbase, etc.)
│   │   ├── CTABanner.jsx           # Blue "Ready to Build Something Amazing?" strip
│   │   └── StatsBar.jsx            # Horizontal stat counters under hero
│   │
│   └── shared/
│       ├── SectionHeading.jsx      # Title + subtitle pattern used across pages
│       └── PageTransition.jsx      # Smooth page transition wrapper
```

### 2.2 Component Specifications from Design

#### Navbar (from image)
- **Layout**: Logo (left) → Nav links (center) → CTA buttons (right)
- **Nav links**: Features, Templates, Pricing, Docs, More
- **Right side**: "Login" text link + "Get Started" solid blue button
- **Behavior**: Sticky top, white background with subtle bottom shadow on scroll
- **Mobile**: Hamburger menu

#### Hero Section (from image)
- **Left column (~55%)**:
  - Headline: "Build Beautiful Websites Faster with PouchCare" — bold, 48px, dark text
  - Subtext: "The all-in-one WordPress theme and builder toolkit for agencies, freelancers, and businesses." — gray, 16px
  - Two buttons: "Explore Templates" (solid blue) + "View Features" (outline with arrow icon)
- **Right column (~45%)**:
  - Large PouchCare logo/icon (the circuit-style "PC" emblem) with decorative blue gradient flowing shapes behind it
- **Below hero**: Stats bar — 3 horizontal stats with icons:
  - "120+ Amazing Plugins" (puzzle icon)
  - "Starter & Custom" (palette icon)  
  - "24/7 Fast Support" (headset icon)

#### Feature Cards (from image)
- **Grid**: 4 cards in a row
- **Each card**:
  - Top: Icon in colored rounded box (blue icon container)
  - Title: Bold, 18px (e.g., "Amazing Builder", "Premade Templates", "Design System", "Dedicated Fast")
  - Description: 2-3 lines gray text
  - Subtle border, white bg, lift on hover
- **Features listed**:
  1. Amazing Builder — Create beautiful pages with drag-and-drop builder
  2. Premade Templates — Ready-to-use professionally designed templates
  3. Design System — Consistent components and design tokens
  4. Dedicated Fast — Optimized for speed and performance

#### Testimonial Section (from image)
- **Layout**: Single featured testimonial quote
- **Content**: Quote text in italics/styled, avatar circle, name "Alex Morgan", role below name, 5-star rating
- **Style**: Light background, centered or left-aligned quote with quotation marks

#### Partners/Trusted By (from image)
- **Label**: "Trusted by Professionals"
- **Logo row**: Grayscale logos — Spotify, Airbnb, Coinbase, and others
- **Style**: Horizontally spaced, centered, grayscale with color on hover

#### CTA Banner (from image)
- **Full-width blue bar** (`#0A7AFF` background)
- **Headline**: "Ready to Build Something Amazing?" — white, bold
- **Subtext**: "Join thousands of creators using PouchCare to build incredible websites. Start your free trial today." — white/light
- **Elements**: Stars/sparkle decorations on left side

#### Footer (from image)
- **Background**: Dark navy (`#0D1B3E`)
- **Layout**: 4 columns
  - Column 1: PouchCare logo + tagline + social icons
  - Column 2: "Product" links (Features, Templates, Pricing, etc.)
  - Column 3: "Resources" links (Documentation, Blog, Support, etc.)
  - Column 4: "Company" links (About, Careers, Contact, etc.)
- **Bottom bar**: Copyright "© 2024 PouchCare" + Terms/Privacy links

---

## 3. PAGE BREAKDOWN

### 3.1 Landing Page (`/`)

| Order | Section          | Background     | Notes                                    |
|-------|------------------|----------------|------------------------------------------|
| 1     | Navbar           | White (sticky) | Always visible                           |
| 2     | Hero             | Gradient/Pattern| Circuit pattern bg + decorative shapes  |
| 3     | Stats Bar        | White          | 3 stat counters with icons               |
| 4     | Features         | Light Gray     | 4-card grid                              |
| 5     | Testimonial      | White          | Single featured review                   |
| 6     | Partners         | White/Light    | Logo bar                                 |
| 7     | CTA Banner       | Blue           | Full-width call to action                |
| 8     | Footer           | Dark Navy      | 4-column layout                          |

### 3.2 Templates Gallery (`/templates`)

| Order | Section               | Notes                                         |
|-------|-----------------------|-----------------------------------------------|
| 1     | Page Header           | "Browse Our Templates" title + search/filter bar |
| 2     | Filter Sidebar/Bar    | Categories: All, Business, Portfolio, Blog, eCommerce, Landing |
| 3     | Template Grid         | 3-column card grid with preview thumbnails    |
| 4     | Template Card         | Thumbnail image, template name, category badge, "Preview"/"Download" buttons |
| 5     | Pagination            | Numbered page navigation                      |
| 6     | CTA Banner            | Reuse from landing page                       |
| 7     | Footer                | Reuse                                         |

### 3.3 Pricing Page (`/pricing`)

| Order | Section               | Notes                                         |
|-------|-----------------------|-----------------------------------------------|
| 1     | Page Header           | "Simple, Transparent Pricing" title            |
| 2     | Toggle                | Monthly / Annual billing toggle               |
| 3     | Pricing Cards         | 3 tiers: Starter (free), Pro, Agency           |
| 4     | Each Card             | Plan name, price, feature list with checkmarks, CTA button. Pro card = highlighted/featured |
| 5     | Feature Comparison    | Full table comparing all plans                 |
| 6     | FAQ Accordion         | Common pricing questions                       |
| 7     | CTA Banner            | Reuse                                         |
| 8     | Footer                | Reuse                                         |

### 3.4 Documentation/Blog (`/docs`)

| Order | Section               | Notes                                         |
|-------|-----------------------|-----------------------------------------------|
| 1     | Page Header           | "Documentation" or "Blog" title + search bar  |
| 2     | Sidebar Navigation    | Collapsible doc categories (Getting Started, Builder, Templates, API, etc.) |
| 3     | Content Area          | Markdown-rendered content with headings, code blocks, images |
| 4     | Breadcrumbs           | Path navigation at top of content              |
| 5     | Table of Contents     | Right sidebar — auto-generated from headings   |
| 6     | Prev/Next Navigation  | Bottom of content area                         |
| 7     | Footer                | Reuse                                         |

---

## 4. PROJECT STRUCTURE

Monorepo path: `apps/pouchcare-frontend/` (under **PouchCare-Platform**).

```
apps/pouchcare-frontend/
├── public/
│   ├── index.html
│   ├── favicon.svg                    # PC logo as favicon
│   └── assets/
│       ├── images/
│       │   ├── logo.svg               # Full PouchCare logo
│       │   ├── logo-icon.svg          # Icon-only version
│       │   ├── hero-decoration.svg    # Flowing blue gradient shapes
│       │   └── circuit-pattern.svg    # Background pattern
│       └── partners/
│           ├── spotify.svg
│           ├── airbnb.svg
│           └── coinbase.svg
│
├── src/
│   ├── index.jsx                      # Entry point
│   ├── App.jsx                        # Router + layout wrapper
│   ├── styles/
│   │   ├── globals.css                # CSS variables, resets, base styles
│   │   └── tailwind.css               # Tailwind directives
│   │
│   ├── components/                    # (See Section 2.1 above)
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── sections/
│   │   └── shared/
│   │
│   ├── pages/
│   │   ├── Home.jsx                   # Landing page — assembles all sections
│   │   ├── Templates.jsx             # Templates gallery
│   │   ├── Pricing.jsx               # Pricing page
│   │   └── Docs.jsx                  # Documentation page
│   │
│   ├── data/
│   │   ├── features.js               # Feature cards data
│   │   ├── templates.js              # Template gallery items
│   │   ├── pricing.js                # Pricing tiers + features
│   │   ├── testimonials.js           # Testimonial quotes
│   │   ├── partners.js               # Partner logo references
│   │   ├── navigation.js             # Nav link structure
│   │   └── docs.js                   # Documentation content/structure
│   │
│   ├── hooks/
│   │   ├── useScrollPosition.js      # For navbar shadow on scroll
│   │   └── useIntersection.js        # For scroll-reveal animations
│   │
│   └── utils/
│       └── cn.js                      # className merge utility (clsx + tailwind-merge)
│
├── tailwind.config.js                 # Extended with PouchCare design tokens
├── package.json
├── vite.config.js                     # Vite as build tool
└── README.md
```

---

## 5. TAILWIND CONFIGURATION

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A7AFF",
          dark: "#0062D6",
          deeper: "#003F8A",
        },
        accent: {
          cyan: "#00C6FF",
          gold: "#FFB800",
          orange: "#FF8C00",
        },
        surface: {
          light: "#F5F7FA",
          blue: "#EBF4FF",
        },
        footer: {
          bg: "#0D1B3E",
          text: "#CBD5E1",
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        logo: "16px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(10, 122, 255, 0.08)",
        "card-hover": "0 8px 32px rgba(10, 122, 255, 0.15)",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Foundation (Est. ~30 min)
- [ ] Scaffold React + Vite project
- [ ] Install dependencies (react-router-dom, tailwindcss, clsx, tailwind-merge, lucide-react)
- [ ] Configure Tailwind with design tokens from Section 5
- [ ] Set up global CSS variables and font imports
- [ ] Create layout components (Navbar, Footer, Container, Section)
- [ ] Set up React Router with all 4 routes

### Phase 2: UI Components (Est. ~30 min)
- [ ] Build Button component (primary, secondary, ghost variants)
- [ ] Build Card component with hover animations
- [ ] Build Badge, Input, Avatar, StarRating, IconBox, Logo
- [ ] Build SectionHeading shared component
- [ ] Create SVG assets (logo, circuit pattern, hero decoration)

### Phase 3: Landing Page (Est. ~45 min)
- [ ] Build Hero section with circuit-board background pattern
- [ ] Build StatsBar with animated counters
- [ ] Build Features section (4-card grid)
- [ ] Build Testimonial section
- [ ] Build Partners logo bar
- [ ] Build CTA Banner
- [ ] Assemble Home page
- [ ] Add scroll-reveal animations (IntersectionObserver)

### Phase 4: Templates Gallery (Est. ~30 min)
- [ ] Build filter/category bar
- [ ] Build TemplateCard with preview thumbnail, badges, buttons
- [ ] Build template grid with responsive columns
- [ ] Add search functionality
- [ ] Add pagination component
- [ ] Assemble Templates page

### Phase 5: Pricing Page (Est. ~30 min)
- [ ] Build billing toggle (Monthly/Annual)
- [ ] Build PricingCard component (standard + featured/highlighted)
- [ ] Build feature comparison table
- [ ] Build FAQ accordion component
- [ ] Assemble Pricing page

### Phase 6: Documentation Page (Est. ~30 min)
- [ ] Build sidebar navigation with collapsible sections
- [ ] Build content area with styled markdown
- [ ] Build breadcrumbs component
- [ ] Build table of contents (auto-generated)
- [ ] Build prev/next page navigation
- [ ] Assemble Docs page

### Phase 7: Polish & Responsive (Est. ~30 min)
- [ ] Responsive testing across all breakpoints (mobile, tablet, desktop)
- [ ] Mobile hamburger menu for Navbar
- [ ] Smooth page transitions
- [ ] Performance optimization (lazy loading, image optimization)
- [ ] Accessibility audit (ARIA labels, focus states, contrast)
- [ ] Cross-browser testing

---

## 7. KEY DESIGN DETAILS TO MATCH PERFECTLY

1. **Hero circuit-board pattern**: Thin light-blue lines forming a subtle PCB/circuit pattern behind the hero content — rendered as an SVG background with opacity ~0.08
2. **Logo gradient flow**: The decorative blue gradient shapes behind the large hero logo must feel organic/flowing, not hard-edged — use SVG curves with gradient fills from `#0A7AFF` to `#00C6FF`
3. **Card top-border accent**: On hover, feature cards reveal a thin blue top border (3px solid `#0A7AFF`) with a smooth transition
4. **Button arrow icons**: Secondary buttons include a right-arrow (`→`) icon that animates slightly on hover (translateX +4px)
5. **Partner logos**: Display in grayscale by default, full color on hover — use CSS filter `grayscale(100%)` with transition
6. **Footer social icons**: Small circular icon buttons (LinkedIn, Twitter/X, GitHub, Dribbble) with hover color change
7. **CTA banner sparkle**: Small star/sparkle SVG decorations on the left side of the blue CTA banner for visual flair
8. **Gold accent dot**: The small gold dot on the logo's circuit line is a key brand element — it should appear consistently across logo usages

---

## 8. ANIMATIONS & MICRO-INTERACTIONS

| Element              | Trigger        | Animation                                                   |
|----------------------|----------------|--------------------------------------------------------------|
| Feature cards        | Hover          | `translateY(-4px)` + shadow expansion + top-border reveal   |
| Primary buttons      | Hover          | Background darkens to `--primary-blue-dark`, slight scale(1.02) |
| Secondary buttons    | Hover          | Border color intensifies, arrow slides right 4px            |
| Partner logos        | Hover          | Grayscale → full color (0.3s ease)                          |
| Stats counters       | Scroll into view| Count up from 0 to target number (1.5s ease-out)           |
| Section content      | Scroll into view| Fade up from 20px below + opacity 0→1 (0.6s, staggered)   |
| Navbar               | Scroll > 50px  | Add bottom shadow (`shadow-sm`)                             |
| Page transitions     | Route change   | Fade in (0.3s)                                              |
| Mobile menu          | Toggle         | Slide down from top (0.3s ease)                             |
| FAQ accordion        | Click          | Smooth height expand/collapse (0.3s)                        |
| Template cards       | Hover          | Slight scale(1.02) + overlay with "Preview" button          |

---

## 9. RESPONSIVE STRATEGY

| Breakpoint  | Layout Changes                                                    |
|-------------|-------------------------------------------------------------------|
| `xl (1280+)`| Full 4-col features, 3-col templates, 3-col pricing, sidebar docs |
| `lg (1024)` | Same as xl but tighter spacing                                    |
| `md (768)`  | 2-col features, 2-col templates, stacked pricing, drawer docs nav |
| `sm (640)`  | 1-col everything, hamburger nav, full-width cards, no sidebar     |
| `< 640`     | Full mobile layout, larger touch targets, stacked hero            |

---

## 10. DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "lucide-react": "^0.383.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

*This plan provides a pixel-accurate blueprint derived directly from the PouchCare design images. Each color, spacing value, font weight, and interaction is mapped from the visual reference to ensure the final build faithfully reproduces the design.*
