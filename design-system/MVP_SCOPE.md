# MVP Scope & Timeline

## Quick Reference

| Item | Value |
|------|-------|
| **Duration** | 2 weeks |
| **Week 1** | Token system + 2 containers + 2 card types + basic plugin shell |
| **Week 2** | All containers + all cards + template generation + theme preview |
| **Breakpoints** | Desktop 1440px, Tablet 768px, Mobile 375px |
| **Plugin Cold Start** | < 2s |
| **Component Gen** | < 500ms per set |
| **Zoom Range** | 50% - 200% |

---

## 1. Week 1 — Foundation

### 1.1 Token System

**Goal:** Complete theme variable collection with all 4 modes and all styles.

- [ ] Create "Theme" variable collection
- [ ] Add 4 modes: DarkNeon, LightMinimal, EsportsBlackRed, CyberpunkPurpleCyan
- [ ] Define 14 color variables per mode (bg, bgElevated, panel, surface, text, textMuted, textInverse, border, borderHover, accent, accent2, success, warn, danger)
- [ ] Define 6 numeric variables per mode (radiusSm, radiusMd, radiusLg, spacingUnit, shadowBlur, glowIntensity)
- [ ] Define 2 string variables per mode (fontDisplay, fontMono)
- [ ] Create 7 text styles (Display/H1, Display/H2, Display/H3, Body/Regular, Body/Small, Body/Caption, Mono/Data)
- [ ] Create 6 paint styles (Surface/Panel, Surface/Card, Accent/Primary, Accent/Secondary, Border/Default, Border/Focus)
- [ ] Validate all contrast ratios >= 4.5:1
- [ ] Implement findOrCreate guards for idempotent re-runs
- [ ] Test: re-run creates no duplicates

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| T1 | Variable collection "Theme" exists with 4 modes | [ ] |
| T2 | All 14 color variables resolve correctly per mode | [ ] |
| T3 | All 6 numeric variables resolve correctly per mode | [ ] |
| T4 | All 7 text styles created with correct font/size/weight | [ ] |
| T5 | All 6 paint styles bound to theme variables | [ ] |
| T6 | Re-running token creation produces no duplicates | [ ] |
| T7 | Contrast ratio text/bg >= 4.5:1 for all themes | [ ] |
| T8 | Font fallback chain works when Orbitron unavailable | [ ] |

### 1.2 Two Containers

**Goal:** Container/Centered and Section/FullBleed component sets.

- [ ] Implement Container/Centered with responsive padding variants
- [ ] Implement Section/FullBleed with background fill
- [ ] Both use auto-layout
- [ ] Both reference theme variables
- [ ] findOrCreate guards prevent duplicates

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| C1 | Container/Centered: max-width 1200px, auto-layout vertical | [ ] |
| C2 | Container/Centered: responsive padding (16/24/32px variants) | [ ] |
| C3 | Section/FullBleed: fill width, min-height 400px | [ ] |
| C4 | Section/FullBleed: vertical padding 64px, centered alignment | [ ] |
| C5 | Both containers use theme variable fills | [ ] |
| C6 | Re-running creates no duplicates | [ ] |

### 1.3 Two Card Types

**Goal:** Card/Generic and Card/Game with all 4 theme variants each.

- [ ] Implement Card/Generic (Minimal, Neon, Cyberpunk, Glass)
- [ ] Implement Card/Game (Minimal, Neon, Cyberpunk, Glass)
- [ ] combineAsVariants with "Theme" property
- [ ] Auto-layout: vertical, padding 16px, gap 12px
- [ ] CTA buttons use accent fill

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| K1 | Card/Generic has 4 variants (Minimal, Neon, Cyberpunk, Glass) | [ ] |
| K2 | Card/Game has 4 variants with image hero placeholder | [ ] |
| K3 | All variants use theme variable colors | [ ] |
| K4 | Auto-layout correctly applied to all cards | [ ] |
| K5 | CTA buttons have correct accent fill and padding | [ ] |
| K6 | Component set property name is "Theme" | [ ] |

### 1.4 Basic Plugin Shell

**Goal:** Working plugin with UI, command router, and error handling.

- [ ] manifest.json with correct metadata and menu commands
- [ ] main.ts with command router (tokens, components, templates, previews, export)
- [ ] ui.html with 3 action buttons + status panel
- [ ] Error boundary: try/catch + figma.notify
- [ ] esbuild.config.js builds successfully
- [ ] TypeScript compiles with no errors

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| P1 | Plugin loads in Figma without errors | [ ] |
| P2 | All 5 menu commands route correctly | [ ] |
| P3 | UI displays with action buttons and status panel | [ ] |
| P4 | Errors show user-friendly notifications | [ ] |
| P5 | Build produces valid dist/main.js | [ ] |
| P6 | TypeScript strict mode passes with no errors | [ ] |

---

## 2. Week 2 — Complete System

### 2.1 All Containers

**Goal:** Complete all 6 container types.

- [ ] Layout/TwoColumn (Default, Reversed, Stacked variants)
- [ ] Layout/Sidebar (280px fixed + fluid main)
- [ ] Layout/Stack (configurable gap variants)
- [ ] Grid/Responsive12 (Desktop, Tablet, Mobile, Compact variants)

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| C7 | TwoColumn: 60/40 split, 24px gap, 3 variants | [ ] |
| C8 | Sidebar: 280px fixed, fluid main, nav stack | [ ] |
| C9 | Stack: vertical, 6 gap options, optional dividers | [ ] |
| C10 | Grid12: 4 breakpoint variants, correct gutter/margin | [ ] |
| C11 | All containers use auto-layout | [ ] |
| C12 | All containers reference theme variables | [ ] |

### 2.2 All Card Types

**Goal:** Complete remaining 4 card types + 2 bonus cards.

- [ ] Card/Guide (4 variants) with difficulty badge and metadata rows
- [ ] Card/Featured (4 variants) with gradient overlay and dual CTAs
- [ ] Card/Stats (4 variants) with data rows and sparkline
- [ ] Card/FAQ (4 variants) with accordion simulation
- [ ] Card/Profile (4 variants) with avatar and social chips
- [ ] Card/Pricing (4 variants) with feature list and pricing

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| K7 | Card/Guide: difficulty badge, time, step count, CTA | [ ] |
| K8 | Card/Featured: hero image, gradient overlay, dual CTAs | [ ] |
| K9 | Card/Stats: 3 data rows, trend indicators, sparkline | [ ] |
| K10 | Card/FAQ: question/answer, chevron, category chip | [ ] |
| K11 | Card/Profile: avatar, name, role, bio, social chips | [ ] |
| K12 | Card/Pricing: tier, price, features, CTA, popular badge | [ ] |
| K13 | All 8 card types have 4 theme variants each (32 total) | [ ] |
| K14 | All cards use component set with "Theme" property | [ ] |

### 2.3 Template Generation

**Goal:** 4 complete page templates using component instances.

- [ ] Guide Hub template (Centered + Guide cards + sidebar)
- [ ] Game Showcase template (FullBleed hero + Game cards + Stats)
- [ ] FAQ & Support template (Centered + FAQ cards + Featured CTA)
- [ ] Dashboard template (Sidebar layout + Stats + Profile + Pricing)
- [ ] All cards are component instances (not detached)
- [ ] Realistic placeholder content (not lorem ipsum)

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| TM1 | Guide Hub: search, filter chips, 3x2 Guide card grid, sidebar | [ ] |
| TM2 | Game Showcase: hero, Featured card, Stats strip, Game card grid | [ ] |
| TM3 | FAQ & Support: search, category cards, 5 FAQ cards, CTA | [ ] |
| TM4 | Dashboard: sidebar nav, Stats row, activity feed, Profile/Pricing aside | [ ] |
| TM5 | All cards are component instances | [ ] |
| TM6 | Section spacing 48px, content spacing 24px, card spacing 16px | [ ] |
| TM7 | Realistic content (game titles, stat labels, guide topics) | [ ] |

### 2.4 Theme Preview

**Goal:** Foundations page with visual theme previews.

- [ ] 4 preview frames (1440x900 each)
- [ ] Color swatches (80x80) with hex labels
- [ ] Typography samples per style
- [ ] Elevation samples (shadow + glow)
- [ ] Component sample instances
- [ ] Contrast ratio labels

**Acceptance Criteria:**

| # | Criterion | Pass/Fail |
|---|---|---|
| FP1 | 4 frames created, one per theme | [ ] |
| FP2 | All 14 color tokens displayed as swatches per theme | [ ] |
| FP3 | All 7 type styles rendered with sample text | [ ] |
| FP4 | 6 elevation samples shown (3 shadow + 3 glow where applicable) | [ ] |
| FP5 | Card instances from component sets displayed | [ ] |
| FP6 | Contrast ratios labeled with pass/warn/fail indicators | [ ] |

---

## 3. Test Matrix

### 3.1 Viewport Testing

| Breakpoint | Width | Components to Test | Status |
|---|---|---|---|
| Desktop | 1440px | All containers at full width, 12-col grid, TwoColumn side-by-side | [ ] |
| Tablet | 768px | Containers with tablet padding, 8-col grid, TwoColumn stacking | [ ] |
| Mobile | 375px | Containers with mobile padding, 4-col grid, Stack layout | [ ] |

### 3.2 Figma Zoom Testing

| Zoom Level | Test | Expected Result | Status |
|---|---|---|---|
| 50% | Component readability | All text readable, structure clear | [ ] |
| 100% | Default working view | Pixel-perfect, all details visible | [ ] |
| 150% | Detail inspection | No blurry edges, clean vector rendering | [ ] |
| 200% | Maximum detail | All tokens, spacing, and effects correct | [ ] |

### 3.3 Theme Switching

| Test Case | Steps | Expected | Status |
|---|---|---|---|
| Mode switch (Dark->Light) | Change collection mode to LightMinimal | All bound variables update colors | [ ] |
| Mode switch (Dark->Esports) | Change collection mode to EsportsBlackRed | Accent changes from cyan to red | [ ] |
| Mode switch (Dark->Cyber) | Change collection mode to CyberpunkPurpleCyan | accent2 changes to fuchsia | [ ] |
| Component inheritance | Switch mode on parent frame | All child instances update | [ ] |
| Paint style update | Switch mode | Paint styles reflect new theme | [ ] |

---

## 4. Performance Budget

| Metric | Target | Measurement Method |
|---|---|---|
| Plugin cold start | < 2s | Time from menu click to UI visible |
| Token creation (all 4 modes) | < 3s | Time for createThemeVariablesAndStyles() |
| Single component set creation | < 500ms | Time per createComponentSet call |
| All components (6 containers + 8 cards) | < 8s | Total for createContainersAndCards() |
| Template generation (4 templates) | < 5s | Total for createTemplates() |
| Theme preview (4 frames) | < 6s | Total for createThemePreviews() |
| Export manifest generation | < 1s | Total for exportLibrarySnapshot() |
| Full bootstrap (tokens + components + previews) | < 15s | Total orchestrator.bootstrap() |
| Memory usage | < 100MB | Figma memory inspector |

---

## 5. Regression Checklist

### 5.1 Re-Run Safety

| Test | Steps | Expected | Status |
|---|---|---|---|
| Token idempotency | Run "Create Tokens" twice | No duplicate variables or styles | [ ] |
| Component idempotency | Run "Create Components" twice | No duplicate component sets | [ ] |
| Template idempotency | Run "Create Templates" twice | Templates updated, not duplicated | [ ] |
| Preview idempotency | Run "Create Previews" twice | Preview frames updated, not duplicated | [ ] |
| Export idempotency | Run "Export" twice | Manifest reflects current state | [ ] |
| Full reset + re-run | Reset All, then run all commands | Clean slate, identical to first run | [ ] |

### 5.2 Duplicate Prevention

| Entity | Guard Method | Status |
|---|---|---|
| Variable collection | `getLocalVariableCollections().find(c => c.name === "Theme")` | [ ] |
| Variables | Check existing collection variables by name | [ ] |
| Text styles | `getLocalTextStyles().find(s => s.name === name)` | [ ] |
| Paint styles | `getLocalPaintStyles().find(s => s.name === name)` | [ ] |
| Components | `getLocalComponentSets().find(c => c.name === name)` | [ ] |
| Pages | `root.children.find(p => p.name === name)` | [ ] |

### 5.3 Font Fallback Chain

| Primary Font | Fallback 1 | Fallback 2 | Status |
|---|---|---|---|
| Orbitron | Inter SemiBold | Inter Regular | [ ] |
| Inter | system-ui | Arial | [ ] |
| JetBrains Mono | Fira Code | Courier New | [ ] |

### 5.4 Error Recovery

| Scenario | Expected Behavior | Status |
|---|---|---|
| Orbitron not available | Falls back to Inter SemiBold, warns user | [ ] |
| JetBrains Mono not available | Falls back to Fira Code, warns user | [ ] |
| Tokens not created before components | Auto-runs token creation first | [ ] |
| Figma API error during creation | Catches error, notifies user, continues where possible | [ ] |
| Network unavailable | Plugin works fully offline | [ ] |
| > 50 existing variables | Warns user about possible clutter | [ ] |
| Partial failure (e.g., 2/4 modes created) | Reports partial success, retries remaining | [ ] |
