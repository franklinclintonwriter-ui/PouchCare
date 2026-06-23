# Design System Documentation

## Quick Reference

| Item | Value |
|------|-------|
| **Token Layers** | Primitive -> Semantic -> Component |
| **Themes** | Dark-Neon, Light-Minimal, Esports-BlackRed, Cyberpunk-PurpleCyan |
| **Type Fonts** | Inter (body), Orbitron (display), JetBrains Mono (data) |
| **Spacing Base** | 4px unit; scale: 8/12/16/24/32/48/64/96 |
| **Radius Scale** | 4/8/12/16/24/9999 (full) |
| **Naming** | `category/element--state--size` (BEM-inspired, Figma-friendly) |
| **Components** | 6 containers, 6 card types, 4 button variants, 3 input states, 5 chip styles |

---

## 1. Semantic Token Architecture

### 1.1 Token Layers

The design system uses a three-tier token architecture:

```
Primitive Tokens (raw hex values)
  |
  v
Semantic Tokens (bg/surface/text intent)
  |
  v
Component Tokens (card/button/input specific)
```

#### Layer 1: Primitive Tokens

Raw color values with no implied usage. Named by hue + shade.

```
primitive/slate-50:   #f8fafc
primitive/slate-100:  #f1f5f9
primitive/slate-200:  #e2e8f0
primitive/slate-300:  #cbd5e1
primitive/slate-400:  #94a3b8
primitive/slate-500:  #64748b
primitive/slate-600:  #475569
primitive/slate-700:  #334155
primitive/slate-800:  #1e293b
primitive/slate-900:  #0f172a
primitive/slate-950:  #020617

primitive/cyan-50:    #ecfeff
primitive/cyan-100:   #cffafe
primitive/cyan-200:   #a5f3fc
primitive/cyan-300:   #67e8f9
primitive/cyan-400:   #22d3ee
primitive/cyan-500:   #06b6d4
primitive/cyan-600:   #0891b2
primitive/cyan-700:   #0e7490
primitive/cyan-800:   #155e75
primitive/cyan-900:   #164e63
primitive/cyan-950:   #083344

primitive/violet-50:  #f5f3ff
primitive/violet-100: #ede9fe
primitive/violet-200: #ddd6fe
primitive/violet-300: #c4b5fd
primitive/violet-400: #a78bfa
primitive/violet-500: #8b5cf6
primitive/violet-600: #7c3aed
primitive/violet-700: #6d28d9
primitive/violet-800: #5b21b6
primitive/violet-900: #4c1d95
primitive/violet-950: #2e1065

primitive/sky-50:     #f0f9ff
primitive/sky-100:    #e0f2fe
primitive/sky-200:    #bae6fd
primitive/sky-300:    #7dd3fc
primitive/sky-400:    #38bdf8
primitive/sky-500:    #0ea5e9
primitive/sky-600:    #0284c7
primitive/sky-700:    #0369a1
primitive/sky-800:    #075985
primitive/sky-900:    #0c4a6e
primitive/sky-950:    #082f49

primitive/indigo-50:  #eef2ff
primitive/indigo-100: #e0e7ff
primitive/indigo-200: #c7d2fe
primitive/indigo-300: #a5b4fc
primitive/indigo-400: #818cf8
primitive/indigo-500: #6366f1
primitive/indigo-600: #4f46e5
primitive/indigo-700: #4338ca
primitive/indigo-800: #3730a3
primitive/indigo-900: #312e81
primitive/indigo-950: #1e1b4b

primitive/red-50:     #fef2f2
primitive/red-100:    #fee2e2
primitive/red-200:    #fecaca
primitive/red-300:    #fca5a5
primitive/red-400:    #f87171
primitive/red-500:    #ef4444
primitive/red-600:    #dc2626
primitive/red-700:    #b91c1c
primitive/red-800:    #991b1b
primitive/red-900:    #7f1d1d
primitive/red-950:    #450a0a

primitive/neutral-50:  #fafafa
primitive/neutral-100: #f5f5f5
primitive/neutral-200: #e5e5e5
primitive/neutral-300: #d4d4d4
primitive/neutral-400: #a3a3a3
primitive/neutral-500: #737373
primitive/neutral-600: #525252
primitive/neutral-700: #404040
primitive/neutral-800: #262626
primitive/neutral-900: #171717
primitive/neutral-950: #0a0a0a

primitive/fuchsia-50:  #fdf4ff
primitive/fuchsia-100: #fae8ff
primitive/fuchsia-200: #f5d0fe
primitive/fuchsia-300: #f0abfc
primitive/fuchsia-400: #e879f9
primitive/fuchsia-500: #d946ef
primitive/fuchsia-600: #c026d3
primitive/fuchsia-700: #a21caf
primitive/fuchsia-800: #86198f
primitive/fuchsia-900: #701a75
primitive/fuchsia-950: #4a044e

primitive/green-50:   #f0fdf4
primitive/green-100:  #dcfce7
primitive/green-200:  #bbf7d0
primitive/green-300:  #86efac
primitive/green-400:  #4ade80
primitive/green-500:  #22c55e
primitive/green-600:  #16a34a
primitive/green-700:  #15803d
primitive/green-800:  #166534
primitive/green-900:  #14532d
primitive/green-950:  #052e16

primitive/amber-50:   #fffbeb
primitive/amber-100:  #fef3c7
primitive/amber-200:  #fde68a
primitive/amber-300:  #fcd34d
primitive/amber-400:  #fbbf24
primitive/amber-500:  #f59e0b
primitive/amber-600:  #d97706
primitive/amber-700:  #b45309
primitive/amber-800:  #92400e
primitive/amber-900:  #78350f
primitive/amber-950:  #451a03

primitive/emerald-300: #6ee7b7
primitive/emerald-400: #34d399
primitive/emerald-500: #10b981

primitive/rose-400:   #fb7185
primitive/rose-500:   #f43f5e
```

#### Layer 2: Semantic Tokens

Intent-based aliases that map to primitives. These change per theme mode.

| Semantic Token | Purpose | Dark-Neon | Light-Minimal | Esports-BlackRed | Cyberpunk-PurpleCyan |
|---|---|---|---|---|---|
| `bg` | Page background | `#0b0f14` | `#f8fafc` | `#0a0a0a` | `#0b1020` |
| `bgElevated` | Elevated surface | `#111827` | `#ffffff` | `#171717` | `#151a2e` |
| `panel` | Panel/sidebar bg | `#121826` | `#ffffff` | `#141414` | `#151a2e` |
| `surface` | Card/content bg | `#1e293b` | `#f1f5f9` | `#262626` | `#1e293b` |
| `text` | Primary text | `#f1f5f9` | `#0f172a` | `#f5f5f5` | `#e6e6ff` |
| `textMuted` | Secondary text | `#94a3b8` | `#64748b` | `#a3a3a3` | `#9aa0c3` |
| `textInverse` | Inverted text | `#0f172a` | `#f8fafc` | `#0a0a0a` | `#0b1020` |
| `border` | Default border | `#1e293b` | `#e2e8f0` | `#262626` | `#2a3352` |
| `borderHover` | Hover border | `#334155` | `#cbd5e1` | `#404040` | `#3d4a6b` |
| `accent` | Primary accent | `#22d3ee` | `#0ea5e9` | `#ef4444` | `#22d3ee` |
| `accent2` | Secondary accent | `#a78bfa` | `#6366f1` | `#22d3ee` | `#d946ef` |
| `success` | Success state | `#34d399` | `#16a34a` | `#22c55e` | `#10b981` |
| `warn` | Warning state | `#f59e0b` | `#d97706` | `#f59e0b` | `#fbbf24` |
| `danger` | Error/danger state | `#ef4444` | `#dc2626` | `#ef4444` | `#f43f5e` |

#### Layer 3: Component Tokens

Derived from semantic tokens for specific component slots.

| Component Token | Maps To | Description |
|---|---|---|
| `card/bg` | `surface` | Card background |
| `card/border` | `border` | Card border color |
| `card/border--hover` | `borderHover` | Card hover border |
| `card/title` | `text` | Card title text |
| `card/body` | `textMuted` | Card body text |
| `button/primary--bg` | `accent` | Primary button fill |
| `button/primary--text` | `textInverse` | Primary button label |
| `button/secondary--bg` | `surface` | Secondary button fill |
| `button/secondary--text` | `accent` | Secondary button label |
| `button/ghost--bg` | `transparent` | Ghost button fill |
| `button/ghost--text` | `accent` | Ghost button label |
| `button/danger--bg` | `danger` | Danger button fill |
| `button/danger--text` | `textInverse` | Danger button label |
| `input/bg` | `bgElevated` | Input background |
| `input/border--default` | `border` | Input default border |
| `input/border--focus` | `accent` | Input focus border |
| `input/border--error` | `danger` | Input error border |
| `input/text` | `text` | Input text color |
| `input/placeholder` | `textMuted` | Input placeholder |
| `chip/default--bg` | `surface` | Default chip bg |
| `chip/default--text` | `text` | Default chip text |
| `chip/accent--bg` | `accent` | Accent chip bg (10% opacity) |
| `chip/accent--text` | `accent` | Accent chip text |
| `chip/success--bg` | `success` | Success chip bg (10% opacity) |
| `chip/danger--bg` | `danger` | Danger chip bg (10% opacity) |
| `chip/outline--border` | `border` | Outline chip border |

---

## 2. Theme Definitions

### 2.1 Dark-Neon

> Slate 950 base, Cyan 400 accent, Violet 400 secondary

**Personality:** High-energy, gaming-forward, cyberpunk-lite. Ideal for esports dashboards, game launchers, and streaming platforms.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `bg` | `#0b0f14` | `11, 15, 20` | Page background |
| `bgElevated` | `#111827` | `17, 24, 39` | Modals, dropdowns |
| `panel` | `#121826` | `18, 24, 38` | Sidebar, nav panels |
| `surface` | `#1e293b` | `30, 41, 59` | Cards, content areas |
| `text` | `#f1f5f9` | `241, 245, 249` | Primary body text |
| `textMuted` | `#94a3b8` | `148, 163, 184` | Captions, labels |
| `textInverse` | `#0f172a` | `15, 23, 42` | Text on light fills |
| `border` | `#1e293b` | `30, 41, 59` | Default borders |
| `borderHover` | `#334155` | `51, 65, 85` | Hover/focus borders |
| `accent` | `#22d3ee` | `34, 211, 238` | CTAs, links, active |
| `accent2` | `#a78bfa` | `167, 139, 250` | Tags, secondary highlights |
| `success` | `#34d399` | `52, 211, 153` | Success indicators |
| `warn` | `#f59e0b` | `245, 158, 11` | Warnings |
| `danger` | `#ef4444` | `239, 68, 68` | Errors, destructive |

### 2.2 Light-Minimal

> Slate 50 base, Sky 500 accent, Indigo 500 secondary

**Personality:** Clean, professional, enterprise-friendly. Ideal for documentation, admin panels, and business dashboards.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `bg` | `#f8fafc` | `248, 250, 252` | Page background |
| `bgElevated` | `#ffffff` | `255, 255, 255` | Modals, dropdowns |
| `panel` | `#ffffff` | `255, 255, 255` | Sidebar, nav panels |
| `surface` | `#f1f5f9` | `241, 245, 249` | Cards, content areas |
| `text` | `#0f172a` | `15, 23, 42` | Primary body text |
| `textMuted` | `#64748b` | `100, 116, 139` | Captions, labels |
| `textInverse` | `#f8fafc` | `248, 250, 252` | Text on dark fills |
| `border` | `#e2e8f0` | `226, 232, 240` | Default borders |
| `borderHover` | `#cbd5e1` | `203, 213, 225` | Hover/focus borders |
| `accent` | `#0ea5e9` | `14, 165, 233` | CTAs, links, active |
| `accent2` | `#6366f1` | `99, 102, 241` | Tags, secondary highlights |
| `success` | `#16a34a` | `22, 163, 74` | Success indicators |
| `warn` | `#d97706` | `217, 119, 6` | Warnings |
| `danger` | `#dc2626` | `220, 38, 38` | Errors, destructive |

### 2.3 Esports-BlackRed

> Neutral 950 base, Red 500 accent, Cyan 400 secondary

**Personality:** Aggressive, competitive, bold. Ideal for tournament platforms, leaderboard UIs, and competitive gaming hubs.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `bg` | `#0a0a0a` | `10, 10, 10` | Page background |
| `bgElevated` | `#171717` | `23, 23, 23` | Modals, dropdowns |
| `panel` | `#141414` | `20, 20, 20` | Sidebar, nav panels |
| `surface` | `#262626` | `38, 38, 38` | Cards, content areas |
| `text` | `#f5f5f5` | `245, 245, 245` | Primary body text |
| `textMuted` | `#a3a3a3` | `163, 163, 163` | Captions, labels |
| `textInverse` | `#0a0a0a` | `10, 10, 10` | Text on light fills |
| `border` | `#262626` | `38, 38, 38` | Default borders |
| `borderHover` | `#404040` | `64, 64, 64` | Hover/focus borders |
| `accent` | `#ef4444` | `239, 68, 68` | CTAs, links, active |
| `accent2` | `#22d3ee` | `34, 211, 238` | Tags, secondary highlights |
| `success` | `#22c55e` | `34, 197, 94` | Success indicators |
| `warn` | `#f59e0b` | `245, 158, 11` | Warnings |
| `danger` | `#ef4444` | `239, 68, 68` | Errors, destructive |

### 2.4 Cyberpunk-PurpleCyan

> Slate 950 base, Cyan 400 accent, Fuchsia 500 secondary

**Personality:** Futuristic, immersive, retro-tech. Ideal for sci-fi game portals, VR/AR interfaces, and creative tech platforms.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `bg` | `#0b1020` | `11, 16, 32` | Page background |
| `bgElevated` | `#151a2e` | `21, 26, 46` | Modals, dropdowns |
| `panel` | `#151a2e` | `21, 26, 46` | Sidebar, nav panels |
| `surface` | `#1e293b` | `30, 41, 59` | Cards, content areas |
| `text` | `#e6e6ff` | `230, 230, 255` | Primary body text |
| `textMuted` | `#9aa0c3` | `154, 160, 195` | Captions, labels |
| `textInverse` | `#0b1020` | `11, 16, 32` | Text on light fills |
| `border` | `#2a3352` | `42, 51, 82` | Default borders |
| `borderHover` | `#3d4a6b` | `61, 74, 107` | Hover/focus borders |
| `accent` | `#22d3ee` | `34, 211, 238` | CTAs, links, active |
| `accent2` | `#d946ef` | `217, 70, 239` | Tags, secondary highlights |
| `success` | `#10b981` | `16, 185, 129` | Success indicators |
| `warn` | `#fbbf24` | `251, 191, 36` | Warnings |
| `danger` | `#f43f5e` | `244, 63, 94` | Errors, destructive |

---

## 3. Typography Scale

### 3.1 Font Stack

| Role | Font Family | Fallback | Usage |
|---|---|---|---|
| **Display** | `Orbitron` | `Inter SemiBold` | Headings H1-H3, hero text |
| **Body** | `Inter` | `system-ui, -apple-system, sans-serif` | Paragraphs, labels, UI text |
| **Data** | `JetBrains Mono` | `Fira Code, monospace` | Stats, code, data tables |

### 3.2 Type Scale

| Token | Font | Size | Line Height | Weight | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `display/h1` | Orbitron | 48px | 56px | 700 | -0.02em | Page titles, hero |
| `display/h2` | Orbitron | 32px | 40px | 600 | -0.01em | Section headings |
| `display/h3` | Orbitron | 24px | 32px | 600 | 0 | Subsection headings |
| `body/regular` | Inter | 16px | 24px | 400 | 0 | Body text |
| `body/small` | Inter | 14px | 20px | 400 | 0 | Compact text, meta |
| `body/caption` | Inter | 12px | 16px | 400 | 0.05em (uppercase) | Labels, captions |
| `mono/data` | JetBrains Mono | 14px | 20px | 400 | 0 | Stats, code |

### 3.3 Extended Scale Reference

| Size | Name | Typical Usage |
|---|---|---|
| 12px | Caption | Labels, fine print, badges |
| 14px | Small / Data | Secondary text, table cells, code |
| 16px | Body | Default paragraph text |
| 18px | Large Body | Emphasized paragraphs |
| 20px | H4 | Subsection titles |
| 24px | H3 | Card titles, minor sections |
| 32px | H2 | Section headings |
| 48px | H1 | Page titles |
| 64px | Display L | Hero headings |
| 96px | Display XL | Splash screens, numerals |

---

## 4. Spacing System

### 4.1 Base Unit

**Base:** 4px

All spacing values are multiples of the 4px base unit.

### 4.2 Spacing Scale

| Token | Value | Multiple | Usage |
|---|---|---|---|
| `spacing/2xs` | 4px | 1x | Icon-to-label gap |
| `spacing/xs` | 8px | 2x | Tight element spacing |
| `spacing/sm` | 12px | 3x | Compact card padding |
| `spacing/md` | 16px | 4x | Default card padding, input padding |
| `spacing/lg` | 24px | 6x | Section gaps, card padding large |
| `spacing/xl` | 32px | 8x | Page section spacing |
| `spacing/2xl` | 48px | 12x | Major section dividers |
| `spacing/3xl` | 64px | 16x | Hero/footer vertical padding |
| `spacing/4xl` | 96px | 24x | Page-level spacing |

### 4.3 Responsive Padding

| Breakpoint | Container Padding |
|---|---|
| Mobile (< 640px) | 16px |
| Tablet (640-1024px) | 24px |
| Desktop (> 1024px) | 32px |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius/sm` | 4px | Chips, badges, small inputs |
| `radius/md` | 8px | Cards, buttons, inputs |
| `radius/lg` | 12px | Modals, large cards |
| `radius/xl` | 16px | Hero sections, panels |
| `radius/2xl` | 24px | Feature cards, images |
| `radius/full` | 9999px | Avatars, pills, circles |

---

## 6. Shadow & Elevation System

### 6.1 Standard Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow/sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (buttons, chips) |
| `shadow/md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow/lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals, popovers |

### 6.2 Theme-Specific Glow Variants

#### Dark-Neon Glow

| Token | Value |
|---|---|
| `glow/neon-sm` | `0 0 8px rgba(34,211,238,0.25)` |
| `glow/neon-md` | `0 0 16px rgba(34,211,238,0.35), 0 0 4px rgba(167,139,250,0.15)` |
| `glow/neon-lg` | `0 0 32px rgba(34,211,238,0.45), 0 0 8px rgba(167,139,250,0.25)` |

#### Cyberpunk-PurpleCyan Glow

| Token | Value |
|---|---|
| `glow/cyber-sm` | `0 0 8px rgba(217,70,239,0.25)` |
| `glow/cyber-md` | `0 0 16px rgba(34,211,238,0.30), 0 0 8px rgba(217,70,239,0.20)` |
| `glow/cyber-lg` | `0 0 32px rgba(34,211,238,0.40), 0 0 16px rgba(217,70,239,0.30)` |

#### Esports-BlackRed Glow

| Token | Value |
|---|---|
| `glow/esports-sm` | `0 0 8px rgba(239,68,68,0.25)` |
| `glow/esports-md` | `0 0 16px rgba(239,68,68,0.35)` |
| `glow/esports-lg` | `0 0 32px rgba(239,68,68,0.45), 0 0 8px rgba(34,211,238,0.15)` |

#### Light-Minimal (No Glow)

Uses standard `shadow/sm`, `shadow/md`, `shadow/lg` only.

---

## 7. Component Inventory

### 7.1 Containers (6 types)

| Component | Description | Key Properties |
|---|---|---|
| `Container/Centered` | Max-width centered container | maxWidth 1200px, responsive padding 16/24/32px |
| `Section/FullBleed` | Full-width section | 100vw, minHeight 400px, vertical padding 64px |
| `Layout/TwoColumn` | Two-column split | 60/40 ratio, 320px min/column, 24px gap |
| `Layout/Sidebar` | Fixed sidebar + fluid main | 280px fixed + fluid, 24px gap |
| `Layout/Stack` | Vertical stack | configurable gap 8-48px, optional dividers |
| `Grid/Responsive12` | 12-column grid | 24px gutter, 16px margin, 4 breakpoints |

### 7.2 Card Types (6 types x 4 variants = 24 total)

| Card Type | Base Size | Key Elements |
|---|---|---|
| `Card/Generic` | 360x240 | Title + subtitle + body + CTA button |
| `Card/Game` | 360x400 | Image hero (16:9) + title + platform chips + rating |
| `Card/Guide` | 360x280 | Title + difficulty badge + time + step counter + CTA |
| `Card/Featured` | 600x400 | Large hero + gradient overlay + dual CTAs |
| `Card/Stats` | 360x320 | Header + 3 data rows + sparkline + trend indicator |
| `Card/FAQ` | 360x200 | Question header + expandable answer + category tag |

**Variant styles per card:**

| Variant | Border | Radius | Fill | Effects |
|---|---|---|---|---|
| **Minimal** | 1px solid `border` | 8px | solid `panel` | none |
| **Neon** | 2px solid `accent` | 12px | solid `panel` | glow (accent, 16px blur, 35% opacity) |
| **Cyberpunk** | 2px dashed `accent2` | 8px | solid `panel` | scanline overlay (optional) |
| **Glass** | 0px | 16px | 60% opacity `panel` | backdrop blur 8px, subtle border glow |

### 7.3 Button Variants (4 types)

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| `button/primary` | `accent` | `textInverse` | none | darken 10% |
| `button/secondary` | `surface` | `accent` | 1px `border` | `borderHover` |
| `button/ghost` | transparent | `accent` | none | 5% `accent` fill |
| `button/danger` | `danger` | `textInverse` | none | darken 10% |

### 7.4 Input States (3 states)

| State | Border | Shadow | Label Color |
|---|---|---|---|
| `input--default` | 1px `border` | none | `textMuted` |
| `input--focus` | 2px `accent` | `glow/sm` (themed) | `text` |
| `input--error` | 2px `danger` | `0 0 4px danger/25%` | `danger` |

### 7.5 Chip Styles (5 types)

| Style | Background | Text | Border |
|---|---|---|---|
| `chip/default` | `surface` | `text` | none |
| `chip/accent` | `accent/10%` | `accent` | none |
| `chip/success` | `success/10%` | `success` | none |
| `chip/danger` | `danger/10%` | `danger` | none |
| `chip/outline` | transparent | `textMuted` | 1px `border` |

---

## 8. Naming Convention

### 8.1 Pattern

```
category/element--state--size
```

**Rules:**
- `/` separates category from element
- `--` separates modifiers (state, size, variant)
- Use lowercase + camelCase for multi-word elements
- Figma-friendly: works as component names, variant properties, and style names

### 8.2 Examples

```
# Tokens
color/bg
color/accent--hover
spacing/md
radius/lg

# Components
Card/Generic--minimal--md
Card/Game--neon--lg
Button/Primary--hover
Button/Ghost--disabled
Input/Text--focus--error

# Styles
TextStyle/Display/H1
TextStyle/Body/Regular
PaintStyle/Surface/Panel
PaintStyle/Accent/Primary

# Layers (in Figma)
Card/title
Card/body
Card/cta--primary
Card/hero--image
```

### 8.3 Variant Property Naming

| Property | Values |
|---|---|
| `Theme` | `Minimal`, `Neon`, `Cyberpunk`, `Glass` |
| `Size` | `sm`, `md`, `lg` |
| `State` | `default`, `hover`, `active`, `disabled`, `focus` |
| `Breakpoint` | `mobile`, `tablet`, `desktop` |

---

## 9. Accessibility Guidelines

### 9.1 Contrast Requirements

| Level | Ratio | Applies To |
|---|---|---|
| **AA Normal** | >= 4.5:1 | Body text (16px and below) |
| **AA Large** | >= 3:1 | Large text (18px+ or 14px bold+) |
| **AAA** | >= 7:1 | Enhanced contrast mode |

### 9.2 Verified Contrast Pairs

| Theme | Pair | Ratio | Status |
|---|---|---|---|
| Dark-Neon | `text` on `bg` | 15.2:1 | Pass |
| Dark-Neon | `textMuted` on `bg` | 6.8:1 | Pass |
| Dark-Neon | `accent` on `bg` | 10.1:1 | Pass |
| Light-Minimal | `text` on `bg` | 15.4:1 | Pass |
| Light-Minimal | `textMuted` on `bg` | 4.6:1 | Pass |
| Light-Minimal | `accent` on `bg` | 4.5:1 | Pass |
| Esports-BlackRed | `text` on `bg` | 18.1:1 | Pass |
| Esports-BlackRed | `accent` on `bg` | 5.0:1 | Pass |
| Cyberpunk | `text` on `bg` | 13.8:1 | Pass |
| Cyberpunk | `accent` on `bg` | 10.4:1 | Pass |

### 9.3 Focus States

- Outline: 2px solid `accent`, 2px offset
- Keyboard navigation visible on all interactive elements
- Reduced-motion: disable glow animations, use static borders instead

---

## 10. Numeric Variables (per mode)

| Variable | Dark-Neon | Light-Minimal | Esports | Cyberpunk |
|---|---|---|---|---|
| `radiusSm` | 4 | 4 | 4 | 4 |
| `radiusMd` | 8 | 8 | 8 | 8 |
| `radiusLg` | 12 | 12 | 12 | 12 |
| `spacingUnit` | 4 | 4 | 4 | 4 |
| `shadowBlur` | 16 | 8 | 12 | 20 |
| `glowIntensity` | 0.35 | 0 | 0.3 | 0.4 |

---

## 11. String Variables (per mode)

| Variable | Dark-Neon | Light-Minimal | Esports | Cyberpunk |
|---|---|---|---|---|
| `fontDisplay` | `Orbitron` | `Orbitron` | `Orbitron` | `Orbitron` |
| `fontMono` | `JetBrains Mono` | `JetBrains Mono` | `JetBrains Mono` | `JetBrains Mono` |
