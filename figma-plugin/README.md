# Design System Bootstrapper — Figma Plugin

A production-ready Figma plugin that generates a complete design system with theme variables, component sets, page templates, and export capabilities.

## Features

- **4 Theme Modes**: DarkNeon, LightMinimal, EsportsBlackRed, CyberpunkPurpleCyan
- **14 Color Variables** per mode with contrast validation
- **7 Text Styles** using Orbitron, Inter, and JetBrains Mono
- **6 Container Types**: Centered, FullBleed, TwoColumn, Sidebar, Stack, Grid12
- **8 Card Types** with 4 variants each (Minimal, Neon, Cyberpunk, Glass)
- **4 Page Templates**: Guide Hub, Game Showcase, FAQ & Support, Dashboard
- **Theme Preview System** with color swatches, typography, and contrast checks
- **Export System** with JSON manifest, CSS variables, and Style Dictionary tokens
- **Idempotent**: safe to re-run without creating duplicates

## Quick Start

```bash
npm install
npm run build
node scripts/validate-manifest.js
```

Then import `manifest.json` into Figma Desktop:
**Plugins > Development > Import plugin from manifest...**

## Development

```bash
npm run dev        # Watch mode
npm run build      # Production bundle
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm run format     # Prettier
```

## Plugin Commands

| Command | Description |
|---------|-------------|
| Create Tokens | Theme variables, text styles, paint styles |
| Create Components | 6 containers + 8 card types with variants |
| Create Templates | 4 page layout templates |
| Create Theme Previews | Foundation page with color/type/effect samples |
| Export Library Snapshot | Cover page + JSON manifest |
| Full Bootstrap | Run all commands in sequence |
| Reset All | Remove all created elements |

## Architecture

```
src/
├── main.ts              Command router, state management
├── ui.html              Plugin UI (buttons, status, manifest viewer)
├── ui.ts                UI message passing utilities
├── lib/
│   ├── tokens.ts        Theme variables and styles
│   ├── components.ts    Container + card factories
│   ├── layouts.ts       Page template generators
│   ├── preview.ts       Theme visualization
│   ├── export.ts        Library snapshot + manifest
│   ├── orchestrator.ts  Master coordinator
│   └── utils/
│       ├── figma-api.ts Safe API wrappers
│       ├── guards.ts    Duplicate prevention
│       ├── colors.ts    Hex/RGB conversion, contrast
│       └── fonts.ts     Font loading with fallbacks
└── types/
    └── figma-extended.d.ts  Branded types
```

## Documentation

See `design-system/` for detailed specifications:
- `DESIGN_SYSTEM.md` — Token architecture, themes, typography, spacing
- `FIGMA_COMPONENTS.md` — Component specs, auto-layout, variant matrix
- `MVP_SCOPE.md` — Timeline, acceptance criteria, test matrix
- `PROJECT_PLAYBOOK.md` — Setup guide, extension guide, troubleshooting
