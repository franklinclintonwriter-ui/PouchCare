# Contributing to Design System Bootstrapper

## Setup

```bash
git clone <repo-url>
cd figma-plugin
npm install
npm run typecheck
npm run build
```

## Development

```bash
npm run dev    # Watch mode with auto-rebuild
```

Import `manifest.json` into Figma Desktop for testing.

## Code Style

- TypeScript strict mode, no `any`
- Explicit return types on all exported functions
- Branded types for Figma node IDs (see `src/types/figma-extended.d.ts`)
- Factory pattern for component creation
- `findOrCreate` guards for duplicate prevention

## Quality Checks

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm run typecheck  # TypeScript
npm run build      # esbuild bundle
```

## Pull Request Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` produces valid `dist/main.js`
- [ ] Tested in Figma Desktop
- [ ] Re-run creates no duplicates
- [ ] All 4 themes work correctly
- [ ] CHANGELOG.md updated

## Adding Components

1. Create factory function in `src/lib/components.ts`
2. Register in `createContainersAndCards()`
3. Add to templates in `src/lib/layouts.ts` (optional)
4. Update manifest menu if adding new commands
5. Update command router in `src/main.ts`

## Adding Themes

1. Add color values in `src/lib/tokens.ts` → `THEME_COLORS`
2. Add numeric values in `THEME_NUMERIC`
3. Add variant styling in `src/lib/components.ts` → `VARIANT_CONFIGS`
4. Preview auto-generates from `THEME_COLORS` keys
