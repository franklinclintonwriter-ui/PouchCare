# Project Playbook

## Quick Reference

| Item | Value |
|------|-------|
| **Setup Time** | < 5 minutes |
| **Node Version** | >= 18.0.0 |
| **Build Tool** | esbuild |
| **Language** | TypeScript (strict) |
| **Linter** | ESLint + TypeScript rules |
| **Formatter** | Prettier |
| **Versioning** | Semantic Versioning (SemVer) |
| **Plugin ID** | `com.yourorg.ds-bootstrapper` |

---

## 1. Bootstrap Script (5-Minute Setup)

### 1.1 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Figma Desktop app (latest version)
- Git

### 1.2 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/pouchcare.git
cd pouchcare/figma-plugin

# 2. Install dependencies
npm install

# 3. Verify TypeScript compiles
npm run typecheck

# 4. Build the plugin
npm run build

# 5. Validate the build
node scripts/validate-manifest.js

# 6. Import into Figma
# Open Figma Desktop → Plugins → Development → Import plugin from manifest
# Navigate to figma-plugin/manifest.json

# 7. Verify
# Open a Figma file → Plugins → Development → Design System Bootstrapper
# Click "Create Tokens" to test
```

### 1.3 One-Line Setup

```bash
npm install && npm run build && node scripts/validate-manifest.js && echo "Ready! Import manifest.json into Figma Desktop."
```

### 1.4 Development Mode

```bash
# Start watch mode (auto-rebuilds on file changes)
npm run dev

# In Figma: Plugins → Development → Design System Bootstrapper
# Changes auto-reload when you re-run the plugin
```

---

## 2. Extension Guide

### 2.1 Adding a New Theme

1. **Define colors** in `src/lib/tokens.ts`:

```typescript
// In THEME_COLORS, add a new entry:
export const THEME_COLORS = {
  // ... existing themes ...
  OceanBreeze: {
    bg: '#0a1628',
    bgElevated: '#0f1d32',
    panel: '#0f1d32',
    surface: '#162844',
    text: '#e0f0ff',
    textMuted: '#7da0c4',
    textInverse: '#0a1628',
    border: '#1a3050',
    borderHover: '#2a4a70',
    accent: '#00bcd4',
    accent2: '#ff7043',
    success: '#26a69a',
    warn: '#ffb300',
    danger: '#ef5350',
  },
};
```

2. **Add mode** to variable collection:
   - The `createThemeVariablesAndStyles()` function auto-creates modes from `THEME_COLORS` keys

3. **Add numeric/string values** in `THEME_NUMERIC` and `THEME_STRINGS`:

```typescript
export const THEME_NUMERIC = {
  // ... existing themes ...
  OceanBreeze: {
    radiusSm: 4, radiusMd: 8, radiusLg: 12,
    spacingUnit: 4, shadowBlur: 14, glowIntensity: 0.3,
  },
};
```

4. **Update variant configs** in `src/lib/components.ts`:
   - Add variant styling for the new theme in each card factory

5. **Update preview** in `src/lib/preview.ts`:
   - New theme automatically included when iterating `THEME_COLORS`

6. **Test:**
   ```bash
   npm run typecheck && npm run build
   ```
   Then re-run the plugin in Figma.

### 2.2 Adding a New Component

1. **Create the factory function** in `src/lib/components.ts`:

```typescript
function createMyNewCard(
  registry: ComponentRegistry,
  themeVars: VariableMap,
): ComponentSetNode {
  const variants: ComponentNode[] = [];

  for (const [themeName, config] of Object.entries(VARIANT_CONFIGS)) {
    const card = figma.createComponent();
    card.name = `Theme=${themeName}`;
    card.resize(360, 280);

    // Apply auto-layout
    applyAutoLayout(card, {
      direction: 'VERTICAL',
      padding: 16,
      spacing: 12,
    });

    // Apply theme styling
    applyThemeToFrame(card, config, themeVars);

    // Add content layers
    // ... (title, body, etc.)

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/MyNew';
  componentSet.description = 'Description of the new card type.';

  registry.set('Card/MyNew', componentSet);
  return componentSet;
}
```

2. **Register** in `createContainersAndCards()`:
   - Add your factory call to the card creation section

3. **Add to template** (optional) in `src/lib/layouts.ts`:
   - Use `componentSet.defaultVariant.createInstance()` in templates

4. **Update manifest** if adding a new menu command:
   ```json
   {
     "menu": [
       // ... existing commands ...
       { "name": "Create My New Cards", "command": "my-new-cards" }
     ]
   }
   ```

5. **Update command router** in `src/main.ts`:
   ```typescript
   case 'my-new-cards':
     await createMyNewCards();
     break;
   ```

### 2.3 Adding a New Menu Command

1. **Add to manifest.json** `menu` array:
   ```json
   { "name": "My Command Label", "command": "my-command" }
   ```

2. **Add handler** in `src/main.ts`:
   ```typescript
   case 'my-command':
     await myCommandHandler();
     figma.notify('My command complete', { timeout: 3000 });
     break;
   ```

3. **Implement handler** in appropriate `src/lib/` module

4. **Rebuild:** `npm run build`

---

## 3. Troubleshooting Matrix

### 3.1 Common Figma API Errors

| Error | Cause | Solution |
|---|---|---|
| `Cannot read properties of null` | Node was deleted or moved | Use `findOrCreate` pattern; check node existence before access |
| `Plugin timed out` | Operation took > 30s | Break into smaller batches; use `figma.commitUndo()` between operations |
| `Maximum call stack size exceeded` | Infinite recursion in layout | Check for circular parent/child relationships |
| `Cannot set property of readonly` | Trying to modify locked/instance | Clone the node or modify the main component instead |
| `Variable not found` | Variable ID changed or deleted | Re-fetch variables by name, not cached ID |
| `Mode does not exist` | Wrong mode ID used | Use `collection.modes.find(m => m.name === name)` |
| `setValueForMode: invalid value` | Wrong type for variable kind | Ensure COLOR variables get `{r,g,b,a}`, FLOAT gets number |

### 3.2 Font Loading Failures

| Issue | Symptom | Solution |
|---|---|---|
| Orbitron not installed | Text shows placeholder font | Fallback to Inter SemiBold; notify user to install Orbitron |
| JetBrains Mono missing | Code text uses wrong font | Fallback to Fira Code, then monospace; notify user |
| Font loading timeout | `figma.loadFontAsync()` hangs | Set 5s timeout per font; use Promise.race with fallback |
| Wrong font weight | Bold/Regular mismatch | Explicitly specify `{ family, style }` in loadFontAsync |
| Font not rendering | Text node shows but wrong glyphs | Check font family name spelling; some fonts use different names in Figma |

### 3.3 Variable Binding Issues

| Issue | Symptom | Solution |
|---|---|---|
| Variable not bound | Color shows as static, not variable-linked | Use `setBoundVariable('fills', variableId)` not just `fills = [...]` |
| Wrong mode displayed | Color shows default mode value | Set explicit mode on frame: `setExplicitVariableModeForCollection()` |
| Variable deleted externally | Bound nodes show broken reference | Validate references on plugin start; rebind if needed |
| Collection limit reached | Cannot add more variables | Figma limit: 5000 variables per file; consolidate if needed |
| Variable type mismatch | Cannot bind COLOR var to TEXT property | Ensure variable kind matches property type |

### 3.4 Build Issues

| Error | Cause | Solution |
|---|---|---|
| `esbuild: command not found` | Not installed | `npm install` to install devDependencies |
| `Cannot find module './ui.html'` | HTML import not configured | Check esbuild.config.js `loader: { '.html': 'text' }` |
| `TS2304: Cannot find name 'figma'` | Missing Figma types | Ensure `@figma/plugin-typings` in devDependencies |
| `TS2307: Cannot find module` | Wrong import path | Check relative paths; use `.js` extension in imports if needed |
| `dist/main.js too large (>500KB)` | Bundle bloat | Enable tree-shaking; check for unused imports |
| `Source map not generated` | esbuild config missing | Add `sourcemap: true` to esbuild options |

---

## 4. Versioning Strategy

### 4.1 Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes to component API or token structure
MINOR: New components, themes, or features (backward compatible)
PATCH: Bug fixes, style tweaks, doc updates
```

### 4.2 Version Bumping

```bash
# Patch release (bug fix)
npm version patch    # 1.0.0 → 1.0.1

# Minor release (new feature)
npm version minor    # 1.0.1 → 1.1.0

# Major release (breaking change)
npm version major    # 1.1.0 → 2.0.0
```

### 4.3 Changelog Format

```markdown
# Changelog

## [1.1.0] - 2024-02-01
### Added
- Card/Profile component with 4 theme variants
- Card/Pricing component with popular badge support
- Dashboard template with sidebar layout

### Changed
- Updated accent color values for Esports theme
- Improved glow intensity for Cyberpunk theme

### Fixed
- Fixed duplicate variable creation on re-run
- Fixed font fallback not triggering for JetBrains Mono

## [1.0.0] - 2024-01-15
### Added
- Initial release
- Theme system with 4 modes (DarkNeon, LightMinimal, EsportsBlackRed, CyberpunkPurpleCyan)
- 6 container types with auto-layout
- 6 card types with 4 variants each (24 total)
- 4 page templates
- Theme preview system
- Export library snapshot
```

### 4.4 Release Process

```bash
# 1. Ensure clean build
npm run lint && npm run typecheck && npm run build

# 2. Validate manifest
node scripts/validate-manifest.js

# 3. Bump version
npm version minor -m "Release v%s"

# 4. Build production bundle
npm run build

# 5. Tag and push
git push && git push --tags

# 6. Update CHANGELOG.md with release notes
```

---

## 5. Team Onboarding

### 5.1 Designer Handoff Checklist

#### For Designers Using the System

- [ ] **Install fonts:** Download and install Orbitron, Inter, and JetBrains Mono
- [ ] **Import plugin:** Figma Desktop → Plugins → Development → Import manifest.json
- [ ] **Run bootstrap:** Plugin → "Create Tokens" → "Create Components" → "Create Templates"
- [ ] **Switch themes:** Select a frame → Design panel → change "Theme" collection mode
- [ ] **Use components:** Assets panel → search "Card/" or "Container/" → drag to canvas
- [ ] **Change variants:** Select instance → Design panel → "Theme" dropdown
- [ ] **Check constraints:** Resize frames to test responsive behavior

#### Design Guidelines

- Always use component instances, never detach
- Use theme variables for custom elements (don't hard-code hex colors)
- Follow naming convention: `category/element--state--size`
- Test designs at all 3 breakpoints (1440px, 768px, 375px)
- Run "Create Theme Previews" to validate color accessibility

### 5.2 Developer Contribution Guide

#### Setup

```bash
# Fork and clone
git clone https://github.com/your-username/pouchcare.git
cd pouchcare/figma-plugin
npm install

# Create feature branch
git checkout -b feature/my-feature

# Start development
npm run dev    # Watch mode
```

#### Code Style

- TypeScript strict mode (no `any`)
- Explicit return types on all functions
- Use branded types for Node IDs (see `src/types/figma-extended.d.ts`)
- Follow existing patterns (factory functions, findOrCreate guards)
- Comments: minimal, only for non-obvious logic

#### PR Template

```markdown
## What
Brief description of the change.

## Why
Motivation and context.

## How
Technical approach.

## Testing
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` produces valid dist/main.js
- [ ] Tested in Figma Desktop (version X.X.X)
- [ ] Re-run creates no duplicates
- [ ] All 4 themes work correctly

## Screenshots
(Figma screenshots of new/changed components)
```

#### Adding Dependencies

1. Check if the codebase already has a similar utility
2. Prefer zero-dependency solutions for Figma plugins
3. If needed: `npm install --save-dev <package>`
4. Update bundle size check: `node scripts/validate-manifest.js`
5. Figma plugins cannot use Node.js APIs (no `fs`, `path`, `http`, etc.)

### 5.3 Project Structure Reference

```
figma-plugin/
├── manifest.json          Plugin metadata + menu commands
├── package.json           Scripts, dependencies
├── tsconfig.json          TypeScript configuration
├── esbuild.config.js      Build configuration
├── .eslintrc.js           Linting rules
├── .prettierrc            Formatting rules
├── Makefile               Common commands
├── CHANGELOG.md           Version history
├── CONTRIBUTING.md        Contribution guidelines
├── src/
│   ├── main.ts            Entry point, command router
│   ├── ui.html            Modal UI markup
│   ├── ui.ts              UI logic, message passing
│   ├── lib/
│   │   ├── tokens.ts      Theme variables, styles
│   │   ├── components.ts  Component factories
│   │   ├── layouts.ts     Template generators
│   │   ├── preview.ts     Theme visualization
│   │   ├── export.ts      Library snapshot
│   │   ├── orchestrator.ts Master coordinator
│   │   └── utils/
│   │       ├── figma-api.ts    Safe API wrappers
│   │       ├── guards.ts       Duplicate prevention
│   │       ├── colors.ts       Color utilities
│   │       └── fonts.ts        Font loading
│   └── types/
│       └── figma-extended.d.ts Augmented types
├── scripts/
│   ├── import-plugin.js   Figma import helper
│   └── validate-manifest.js Build validator
├── dist/                  Build output (gitignored)
│   ├── main.js
│   └── main.js.map
└── .github/
    └── workflows/
        └── ci.yml         GitHub Actions CI
```

### 5.4 Key Contacts & Resources

| Resource | Link |
|---|---|
| Figma Plugin API Docs | https://www.figma.com/plugin-docs/ |
| Figma Variables API | https://www.figma.com/plugin-docs/api/variables/ |
| Plugin Typings | https://github.com/figma/plugin-typings |
| Inter Font | https://rsms.me/inter/ |
| Orbitron Font | https://fonts.google.com/specimen/Orbitron |
| JetBrains Mono | https://www.jetbrains.com/lp/mono/ |
