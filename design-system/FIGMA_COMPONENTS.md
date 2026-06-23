# Figma Components Specification

## Quick Reference

| Item | Value |
|------|-------|
| **Pages** | Cover, Foundations, Components, Templates, Archive |
| **Containers** | 6 types (Centered, FullBleed, TwoColumn, Sidebar, Stack, Grid12) |
| **Cards** | 6 types x 4 variants = 24 component sets |
| **Auto-Layout Modes** | Hug, Fill, Fixed |
| **Grid** | 12-column, 24px gutter, 16px margin |
| **Min Contrast** | 4.5:1 (AA standard) |
| **Breakpoints** | Desktop 1440px, Tablet 768px, Mobile 375px |

---

## 1. Page Structure

### 1.1 Figma File Organization

```
File: "PouchCare Design System"
├── Cover (page)
│   └── Cover card: title, version, date, component count
├── Foundations (page)
│   ├── Colors: all theme swatches + contrast grid
│   ├── Typography: type samples per style
│   ├── Spacing: visual spacing scale
│   └── Effects: shadow + glow samples per theme
├── Components (page)
│   ├── Containers: 6 component sets
│   ├── Cards: 6 component sets (24 variants total)
│   ├── Buttons: 4 variants x states
│   ├── Inputs: 3 states
│   └── Chips: 5 styles
├── Templates (page)
│   ├── Guide Hub
│   ├── Game Showcase
│   ├── FAQ & Support
│   └── Dashboard
└── Archive (page)
    └── Deprecated/experimental components
```

### 1.2 Page Setup

| Page | Canvas Size | Background | Grid |
|---|---|---|---|
| Cover | 1440 x 900 | `bg` variable | None |
| Foundations | Auto (grow) | `bg` variable | 8px soft grid |
| Components | Auto (grow) | `bgElevated` variable | 8px soft grid |
| Templates | Auto (grow) | `bg` variable | 12-column layout grid |
| Archive | Auto (grow) | `surface` variable | None |

---

## 2. Auto-Layout Specifications

### 2.1 Layout Modes

| Mode | Behavior | When to Use |
|---|---|---|
| **Hug** | Shrink to content size | Icons, chips, badges, inline elements |
| **Fill** | Expand to parent width/height | Card bodies, input fields, list items |
| **Fixed** | Explicit pixel value | Sidebar (280px), image hero (360px), avatar (80px) |

### 2.2 Padding Math

```
Inner padding = spacing token value
Card padding:
  - sm cards: 12px (spacing/sm)
  - md cards: 16px (spacing/md)
  - lg cards: 24px (spacing/lg)

Container padding (responsive):
  - Mobile:  16px horizontal
  - Tablet:  24px horizontal
  - Desktop: 32px horizontal
```

### 2.3 Nested Frame Strategies

```
Container (fill, vertical)
  ├── Header Frame (fill, horizontal, hug height)
  │   ├── Logo (fixed 32x32)
  │   ├── Nav (hug, horizontal, gap 24px)
  │   └── Actions (hug, horizontal, gap 12px)
  ├── Content Frame (fill, vertical, gap 24px)
  │   ├── Hero Section (fill, hug height)
  │   └── Card Grid (fill, wrap, gap 16px)
  └── Footer Frame (fill, horizontal, hug height)
```

---

## 3. Constraint Rules

### 3.1 Responsive Behavior

| Element | Horizontal | Vertical | Notes |
|---|---|---|---|
| Page container | Left + Right (stretch) | Top | Fills viewport width |
| Sidebar | Left, Fixed width | Top + Bottom (stretch) | 280px always |
| Main content | Left + Right (stretch) | Top | Fluid width |
| Cards in grid | Scale (% width) | Top, Hug height | Maintains column ratio |
| Images | Scale (fill) | Scale (fill) | Maintains aspect ratio in frame |
| Buttons | Hug | Hug | Content-driven size |
| Inputs | Left + Right (stretch) | Hug | Full width of parent |

### 3.2 Layout Grids

| Grid Name | Columns | Gutter | Margin | Usage |
|---|---|---|---|---|
| Desktop12 | 12 | 24px | 32px | Primary layout grid |
| Tablet8 | 8 | 16px | 24px | Tablet breakpoint |
| Mobile4 | 4 | 12px | 16px | Mobile breakpoint |
| Component | 8px soft | - | - | Component internal alignment |

---

## 4. Accessibility Specifications

### 4.1 Contrast Ratios (Minimum 4.5:1)

| Foreground | Background | Dark-Neon | Light-Minimal | Esports | Cyberpunk |
|---|---|---|---|---|---|
| `text` | `bg` | 15.2:1 | 15.4:1 | 18.1:1 | 13.8:1 |
| `text` | `surface` | 9.4:1 | 12.1:1 | 11.2:1 | 9.4:1 |
| `textMuted` | `bg` | 6.8:1 | 4.6:1 | 7.8:1 | 5.9:1 |
| `accent` | `bg` | 10.1:1 | 4.5:1 | 5.0:1 | 10.4:1 |
| `accent` | `surface` | 6.2:1 | 3.6:1 | 3.1:1 | 6.2:1 |
| `textInverse` | `accent` | 5.3:1 | 4.9:1 | 3.5:1 | 5.3:1 |

### 4.2 Focus States

```
Focus ring specification:
  outline: 2px solid accent
  outline-offset: 2px
  border-radius: inherit + 2px

Focus within cards:
  Card border transitions to accent color
  Internal focusable elements get standard outline

Tab order:
  Follow DOM order: header → nav → main content → sidebar → footer
```

### 4.3 Reduced-Motion Alternatives

| Standard Effect | Reduced-Motion Alternative |
|---|---|
| Glow pulse animation | Static glow border |
| Hover scale transform | Background color change |
| Slide-in transitions | Instant appear |
| Loading spinners | Static progress bar |
| Card flip animation | Opacity fade |

---

## 5. Container Specifications

### 5.1 Container/Centered

```
┌─────────────────────────────────────────────────────────────┐
│  padding-x: 16/24/32px (responsive)                         │
│  ┌─────────────────────────────────────┐                    │
│  │  max-width: 1200px                  │                    │
│  │  margin: 0 auto                      │                    │
│  │  auto-layout: vertical               │                    │
│  │  gap: 24px                           │                    │
│  │  alignment: center                   │                    │
│  │                                      │                    │
│  │  [Content fills here]               │                    │
│  │                                      │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | Fill container |
| Max Width | 1200px |
| Padding (Mobile) | 16px horizontal, 0 vertical |
| Padding (Tablet) | 24px horizontal, 0 vertical |
| Padding (Desktop) | 32px horizontal, 0 vertical |
| Auto-Layout | Vertical |
| Alignment | Center horizontal |
| Gap | 24px default |
| Background | transparent (inherits) |

### 5.2 Section/FullBleed

```
┌═══════════════════════════════════════════════════════════════┐
║  width: 100vw (fill)                                          ║
║  min-height: 400px                                            ║
║  padding: 64px vertical, 32px horizontal                      ║
║  background: bg variable                                      ║
║                                                               ║
║  auto-layout: vertical                                        ║
║  alignment: center                                            ║
║  gap: 32px                                                    ║
║                                                               ║
║  [Content centered within]                                    ║
║                                                               ║
└═══════════════════════════════════════════════════════════════┘
```

| Property | Value |
|---|---|
| Width | Fill (100vw) |
| Min Height | 400px |
| Padding | 64px top/bottom, 32px left/right |
| Auto-Layout | Vertical |
| Alignment | Center both |
| Gap | 32px |
| Background | `bg` variable fill |

### 5.3 Layout/TwoColumn

```
┌────────────────────────────────┬──────────────────────┐
│  Left Column (60%)             │  Right Column (40%)  │
│  min-width: 320px              │  min-width: 320px    │
│  auto-layout: vertical         │  auto-layout: vertical│
│  gap: 24px                     │  gap: 24px           │
│                                │                      │
│  [Content stack]               │  [Aside stack]       │
│                                │                      │
└────────────────────────────────┴──────────────────────┘
Gap: 24px between columns
Wrap: single column at <768px (variant: Stacked)
```

| Property | Value |
|---|---|
| Layout | Horizontal auto-layout |
| Gap | 24px |
| Left Column | 60% width, min 320px, fill vertical |
| Right Column | 40% width, min 320px, fill vertical |
| Variants | `Default` (60/40), `Reversed` (40/60), `Stacked` (100/100) |
| Child Layout | Vertical auto-layout, gap 24px |

### 5.4 Layout/Sidebar

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  Main Content                             │
│ 280px    │  fluid (fill)                            │
│ fixed    │                                          │
│          │  ┌─ Header Bar ─────────────────────┐    │
│ ┌─Logo─┐ │  │                                  │    │
│ ├─Nav──┤ │  └──────────────────────────────────┘    │
│ │ Item │ │  ┌─ Content Area ───────────────────┐    │
│ │ Item │ │  │                                  │    │
│ │ Item │ │  │                                  │    │
│ │ Item │ │  │                                  │    │
│ │ Item │ │  │                                  │    │
│ ├──────┤ │  └──────────────────────────────────┘    │
│ │User  │ │                                          │
│ └──────┘ │                                          │
└──────────┴──────────────────────────────────────────┘
Gap: 24px
```

| Property | Value |
|---|---|
| Layout | Horizontal auto-layout |
| Gap | 24px |
| Sidebar Width | 280px fixed |
| Sidebar Layout | Vertical, padding 16px, gap 8px |
| Sidebar Contents | Logo + 5 nav items + user profile mini-card |
| Main Width | Fill (fluid) |
| Main Layout | Vertical, gap 24px |
| Main Contents | Header bar + content area (hug height) |

### 5.5 Layout/Stack

```
┌─────────────────────────────────────┐
│  Item 1                             │
├─────────────────────────────────────┤  gap: configurable
│  Item 2                             │  (8/12/16/24/32/48)
├─────────────────────────────────────┤
│  Item 3                             │
├─────────────────────────────────────┤
│  Item 4                             │
└─────────────────────────────────────┘
Optional: 1px divider lines between items
```

| Property | Value |
|---|---|
| Layout | Vertical auto-layout |
| Width | Hug (content-driven) or Fill (parent-driven) |
| Gap Options | 8px, 12px, 16px, 24px, 32px, 48px |
| Dividers | Optional 1px `border` color between items |
| Alignment | Left (default), Center, Right |

### 5.6 Grid/Responsive12

```
Desktop (12 columns):
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│2│3│4│5│6│7│8│9│0│1│2│  gutter: 24px, margin: 16px
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘

Tablet (6 columns):
┌──┬──┬──┬──┬──┬──┐
│ 1│ 2│ 3│ 4│ 5│ 6│  gutter: 16px, margin: 16px
└──┴──┴──┴──┴──┴──┘

Mobile (4 columns):
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │  gutter: 12px, margin: 16px
└───┴───┴───┴───┘

Compact (2 columns):
┌──────┬──────┐
│  1   │  2   │  gutter: 8px, margin: 8px
└──────┴──────┘
```

| Property | Desktop | Tablet | Mobile | Compact |
|---|---|---|---|---|
| Columns | 12 | 6 | 4 | 2 |
| Gutter | 24px | 16px | 12px | 8px |
| Margin | 16px | 16px | 16px | 8px |
| Column Min Width | 64px | 80px | 72px | 120px |
| Span Helpers | col-4, col-6, col-8, col-12 | col-3, col-6 | col-2, col-4 | col-1, col-2 |

---

## 6. Card Specifications

### 6.1 Card/Generic (Text-Only)

```
┌─────────────────────────────────┐
│  padding: 16px                  │
│                                 │
│  Title (H3)                     │
│  Subtitle (Body/Small, muted)   │
│                                 │
│  Body text (Body/Regular)       │
│  Multiple lines supported       │
│                                 │
│  [CTA Button]                   │
│                                 │
└─────────────────────────────────┘
Base: 360 x 240
```

| Property | Value |
|---|---|
| Size | 360 x 240 (hug height) |
| Padding | 16px all |
| Auto-Layout | Vertical, gap 12px |
| Title | H3 style, `text` color |
| Subtitle | Body/Small, `textMuted` color |
| Body | Body/Regular, `textMuted` color |
| CTA | Button/Primary, hug |

### 6.2 Card/Game (Image Hero)

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   Image Hero (16:9)       │  │
│  │   360 x 202               │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  padding: 16px                  │
│                                 │
│  Title (H3)                     │
│                                 │
│  [PS5] [PC] [Xbox]   ★ 4.8     │
│  (platform chips)   (rating)    │
│                                 │
└─────────────────────────────────┘
Base: 360 x 400
```

| Property | Value |
|---|---|
| Size | 360 x 400 (hug height) |
| Image | 16:9 ratio, fill width, 8px top radius |
| Padding (below image) | 16px |
| Auto-Layout | Vertical, gap 12px |
| Title | H3 style, `text` color |
| Chips Row | Horizontal, gap 8px, hug |
| Platform Chips | chip/default style, Body/Caption |
| Rating Badge | chip/accent style, star icon + number |

### 6.3 Card/Guide (Metadata)

```
┌─────────────────────────────────┐
│  padding: 16px                  │
│                                 │
│  [Beginner]          (badge)    │
│                                 │
│  Title (H3)                     │
│                                 │
│  ⏱ 15 min  │  📋 12 steps      │
│  (time)       (step count)      │
│                                 │
│  Brief description text         │
│                                 │
│  [Start Guide →]    (CTA)      │
│                                 │
└─────────────────────────────────┘
Base: 360 x 280
```

| Property | Value |
|---|---|
| Size | 360 x 280 (hug height) |
| Padding | 16px all |
| Auto-Layout | Vertical, gap 12px |
| Badge | chip/accent, positioned top-right or inline |
| Title | H3 style, `text` color |
| Metadata Row | Horizontal, gap 16px, Body/Small, `textMuted` |
| Description | Body/Regular, `textMuted`, max 2 lines |
| CTA | Button/Primary, hug |

### 6.4 Card/Featured (Large CTA)

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │   Image Hero (16:9)                           │  │
│  │   600 x 240 (top 60%)                         │  │
│  │                                               │  │
│  │   ┌─ Gradient Overlay (bottom 40%) ─────────┐ │  │
│  │   │                                         │ │  │
│  │   │  Title (H2)                             │ │  │
│  │   │  Description (Body)                     │ │  │
│  │   │                                         │ │  │
│  │   │  [Primary CTA]  [Secondary Link →]      │ │  │
│  │   │                                         │ │  │
│  │   └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
Base: 600 x 400
```

| Property | Value |
|---|---|
| Size | 600 x 400 |
| Image | 16:9, fill, top 60% |
| Gradient | Linear, transparent to `bg` (bottom 40%) |
| Padding (overlay) | 24px |
| Title | H2 style, `text` color |
| Description | Body/Regular, `textMuted`, max 2 lines |
| Primary CTA | Button/Primary, padding 16px/24px |
| Secondary Link | Text link, `accent` color, underline on hover |

### 6.5 Card/Stats (Data Grid)

```
┌─────────────────────────────────┐
│  padding: 16px                  │
│                                 │
│  📊 Performance   (icon+title)  │
│                                 │
│  K/D Ratio           2.45  ▲   │
│  ─────────────────────────────  │
│  Win Rate           68.2%  ▲   │
│  ─────────────────────────────  │
│  Avg. FPS            144   ▼   │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Sparkline (120x40)       │  │
│  │  gradient fill            │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
Base: 360 x 320
```

| Property | Value |
|---|---|
| Size | 360 x 320 (hug height) |
| Padding | 16px all |
| Auto-Layout | Vertical, gap 12px |
| Header | Horizontal: icon (20x20) + H3, gap 8px |
| Data Row | Horizontal: label (Body/Small, fill) + value (Mono/Data, hug) + trend (Body/Small) |
| Divider | 1px `border` color between rows |
| Sparkline | 120 x 40 rectangle, gradient fill (accent to transparent) |
| Trend ▲ | `success` color |
| Trend ▼ | `danger` color |

### 6.6 Card/FAQ (Accordion Simulation)

```
┌─────────────────────────────────┐
│  padding: 16px                  │
│                                 │  [Category]
│  How do I reset my password? ▼  │  (chip, top-right)
│                                 │
│  ┌───────────────────────────┐  │
│  │  Answer body (hidden/0h)  │  │  Expanded variant:
│  │  Click "Forgot Password"  │  │  frame height = hug
│  │  on the login page...     │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
Base: 360 x 200 (collapsed), auto (expanded)
```

| Property | Value |
|---|---|
| Size | 360 x auto (hug height) |
| Padding | 16px all |
| Auto-Layout | Vertical, gap 8px |
| Question | H3 style, horizontal with chevron icon (▼/▲) |
| Answer Frame | Vertical, gap 8px, clip content |
| Collapsed | Answer frame height = 0, overflow hidden |
| Expanded | Answer frame height = hug |
| Category Chip | chip/outline, absolute top-right (or flow) |
| Chevron | Text "▼" or polygon, `textMuted` color, rotates in expanded |

---

## 7. Variant Matrix

### 7.1 Card/Generic Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Shadow | none | glow/neon-md | none | none |
| Effect | none | Drop shadow glow | Scanline overlay | Layer blur 8px |
| Title Color | `text` | `text` | `text` | `text` |
| Body Color | `textMuted` | `textMuted` | `textMuted` | `textMuted` |
| CTA Style | Button/Primary | Button/Primary + glow | Button/Primary | Button/Primary + frosted |

### 7.2 Card/Game Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Image Overlay | none | subtle cyan tint | red vignette | frosted bottom |
| Rating Badge | `surface` bg | `accent` bg + glow | `accent` bg | transparent + blur |
| Chip Style | chip/default | chip/accent | chip/danger | chip/outline |

### 7.3 Card/Guide Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Badge | chip/default | chip/accent + glow | chip/danger | chip/outline |
| Metadata | `textMuted` | `accent` secondary | `textMuted` | `textMuted` |
| Step Icon | `textMuted` fill | `accent2` fill | `accent` fill | `text` fill |

### 7.4 Card/Featured Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Gradient | `bg` to transparent | `bg` + cyan tint | `bg` + red edge | frosted panel |
| Glow | none | animated multi-shadow | none | subtle edge glow |
| CTA | solid primary | glow border CTA | dashed border CTA | frosted CTA |

### 7.5 Card/Stats Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Data Values | `text` (Mono) | `accent` (Mono) | `accent2` (Mono) | `text` (Mono) |
| Dividers | 1px solid `border` | 1px solid `accent/20%` | 1px dashed `accent2` | 1px solid `text/10%` |
| Sparkline | `accent` gradient | `accent` + glow | `accent2` gradient | `text/30%` gradient |
| Trend Colors | green/red standard | neon green/red | accent/danger | standard |

### 7.6 Card/FAQ Variants

| Property | Minimal | Neon | Cyberpunk | Glass |
|---|---|---|---|---|
| Fill | solid `panel` | solid `panel` | solid `panel` | `panel` 60% opacity |
| Border | 1px solid `border` | 2px solid `accent` | 2px dashed `accent2` | 0px |
| Radius | 8px | 12px | 8px | 16px |
| Question Color | `text` | `text` | `text` | `text` |
| Chevron | `textMuted` | `accent` | `accent2` | `text` |
| Answer Panel | solid `bgElevated` | `bgElevated` + glow | `bgElevated` dashed | blur background |
| Category Chip | chip/outline | chip/accent | chip/danger | chip/outline |

---

## 8. Additional Card Types

### 8.1 Card/Profile

```
┌─────────────────────────────────┐
│  padding: 20px                  │
│  align: center                  │
│                                 │
│         ┌──────┐                │
│         │ 80px │  (avatar)      │
│         │circle│                │
│         └──────┘                │
│                                 │
│      Name (H3, center)          │
│      Role (Body/Small, muted)   │
│                                 │
│  Bio text (Body/Regular,        │
│  centered, max 3 lines)         │
│                                 │
│  [Twitter] [GitHub] [LinkedIn]  │
│  (social chips, horizontal)     │
│                                 │
└─────────────────────────────────┘
Base: 320 x 400
```

| Property | Value |
|---|---|
| Size | 320 x 400 (hug height) |
| Padding | 20px all |
| Auto-Layout | Vertical, gap 12px, center align |
| Avatar | 80px circle, `surface` fill, clip content |
| Name | H3 style, `text` color, center |
| Role | Body/Small, `textMuted`, center |
| Bio | Body/Regular, `textMuted`, center, max 3 lines |
| Social Chips | Horizontal, gap 8px, chip/accent style |

### 8.2 Card/Pricing

```
┌─────────────────────────────────┐
│  padding: 24px                  │
│  align: center                  │
│                                 │
│  [Popular]  (badge, conditional)│
│                                 │
│  Pro Plan (H3)                  │
│                                 │
│  $̶4̶9̶  $29/mo (price)            │
│  (strikethrough + current)      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ✓ Feature one                  │
│  ✓ Feature two                  │
│  ✓ Feature three                │
│  ✓ Feature four                 │
│  ✓ Feature five                 │
│  ✗ Feature six (disabled)       │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [Get Started]  (CTA, full-w)   │
│                                 │
└─────────────────────────────────┘
Base: 360 x 520
```

| Property | Value |
|---|---|
| Size | 360 x 520 (hug height) |
| Padding | 24px all |
| Auto-Layout | Vertical, gap 16px, center align |
| Popular Badge | chip/accent, `accent` bg, hidden by default |
| Tier Name | H3 style, `text` color |
| Original Price | Body/Regular, `textMuted`, strikethrough decoration |
| Current Price | Display/H2 size, `accent` color |
| Divider | 1px `border` color, full width |
| Feature List | Vertical, gap 8px |
| Feature Item (included) | checkmark (`success`) + Body/Regular `text` |
| Feature Item (excluded) | X mark (`textMuted`) + Body/Regular `textMuted` strikethrough |
| CTA | Button/Primary, fill width |

---

## 9. Component Set Organization

### 9.1 Naming Structure

```
Figma Layer Tree:
├── Cards/
│   ├── Card/Generic          (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/Game             (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/Guide            (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/Featured         (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/Stats            (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/FAQ              (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   ├── Card/Profile          (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
│   └── Card/Pricing          (ComponentSet: Theme=Minimal,Neon,Cyberpunk,Glass)
├── Containers/
│   ├── Container/Centered    (ComponentSet: Breakpoint=Desktop,Tablet,Mobile)
│   ├── Section/FullBleed     (Component)
│   ├── Layout/TwoColumn      (ComponentSet: Layout=Default,Reversed,Stacked)
│   ├── Layout/Sidebar        (Component)
│   ├── Layout/Stack          (ComponentSet: Gap=8,12,16,24,32,48)
│   └── Grid/Responsive12     (ComponentSet: Breakpoint=Desktop,Tablet,Mobile,Compact)
└── Layouts/
    (Template instances, not component sets)
```

### 9.2 Description Fields

| Component Set | Description |
|---|---|
| Card/Generic | Basic text card with title, subtitle, body, and CTA. Use for general content blocks. |
| Card/Game | Game showcase card with 16:9 image hero, platform chips, and rating. Use for game listings. |
| Card/Guide | Tutorial/guide card with difficulty badge, time estimate, and step count. Use for educational content. |
| Card/Featured | Large hero card with gradient overlay and dual CTAs. Use for featured/promoted content. |
| Card/Stats | Dashboard data card with labeled values, trend indicators, and sparkline. Use for KPI displays. |
| Card/FAQ | Accordion-style Q&A card with expandable answer. Use for help/support sections. |
| Card/Profile | User profile card with avatar, name, role, bio, and social links. Use for team/user displays. |
| Card/Pricing | Pricing tier card with price, feature list, and CTA. Use for plan comparison. |
| Container/Centered | Max-width centered container with responsive padding. Primary content wrapper. |
| Section/FullBleed | Full-width section with background fill. Use for hero sections and CTAs. |
| Layout/TwoColumn | Two-column split layout (60/40). Use for content + sidebar patterns. |
| Layout/Sidebar | Fixed sidebar + fluid main content. Use for dashboard/app layouts. |
| Layout/Stack | Vertical list with configurable gap. Use for form fields, card lists, nav items. |
| Grid/Responsive12 | 12-column responsive grid with gutter and margin. Use for card grids and multi-column layouts. |

### 9.3 Thumbnail Frames

Each component set includes a 120x120 preview thumbnail frame:

- Background: `surface` fill
- Border: 1px `border`
- Radius: 8px
- Content: Miniature representation of the component (scaled to fit)
- Label: Component name (Caption style) below thumbnail
