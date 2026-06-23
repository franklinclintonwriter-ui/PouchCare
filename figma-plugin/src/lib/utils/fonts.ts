/**
 * Font loading utilities with fallback chain support.
 */

interface FontSpec {
  family: string;
  style: string;
}

interface FontFallbackChain {
  primary: FontSpec;
  fallbacks: FontSpec[];
}

const FONT_CHAINS: Record<string, FontFallbackChain> = {
  display: {
    primary: { family: 'Orbitron', style: 'Bold' },
    fallbacks: [
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Regular' },
    ],
  },
  displaySemiBold: {
    primary: { family: 'Orbitron', style: 'Semi Bold' },
    fallbacks: [
      { family: 'Orbitron', style: 'Bold' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Regular' },
    ],
  },
  body: {
    primary: { family: 'Inter', style: 'Regular' },
    fallbacks: [{ family: 'Roboto', style: 'Regular' }],
  },
  bodySmall: {
    primary: { family: 'Inter', style: 'Regular' },
    fallbacks: [{ family: 'Roboto', style: 'Regular' }],
  },
  caption: {
    primary: { family: 'Inter', style: 'Regular' },
    fallbacks: [{ family: 'Roboto', style: 'Regular' }],
  },
  mono: {
    primary: { family: 'JetBrains Mono', style: 'Regular' },
    fallbacks: [
      { family: 'Fira Code', style: 'Regular' },
      { family: 'Courier New', style: 'Regular' },
    ],
  },
};

/** Loaded font cache to avoid redundant loading. */
const loadedFonts = new Set<string>();

function fontKey(spec: FontSpec): string {
  return `${spec.family}::${spec.style}`;
}

/**
 * Try to load a single font, returns true if successful.
 */
async function tryLoadFont(spec: FontSpec): Promise<boolean> {
  const key = fontKey(spec);
  if (loadedFonts.has(key)) return true;

  try {
    await figma.loadFontAsync(spec);
    loadedFonts.add(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a font with fallback chain. Returns the spec that was successfully loaded.
 * Throws if no font in the chain could be loaded.
 */
export async function loadFontWithFallback(role: string): Promise<FontSpec> {
  const chain = FONT_CHAINS[role];
  if (!chain) {
    throw new Error(`Unknown font role: ${role}`);
  }

  if (await tryLoadFont(chain.primary)) {
    return chain.primary;
  }

  console.warn(
    `Primary font ${chain.primary.family} ${chain.primary.style} unavailable, trying fallbacks...`,
  );

  for (const fallback of chain.fallbacks) {
    if (await tryLoadFont(fallback)) {
      console.warn(`Using fallback font: ${fallback.family} ${fallback.style}`);
      return fallback;
    }
  }

  throw new Error(
    `No fonts available for role "${role}". Tried: ${[chain.primary, ...chain.fallbacks].map((f) => `${f.family} ${f.style}`).join(', ')}`,
  );
}

/**
 * Load all required fonts in parallel with fallback support.
 * Returns a map of role → loaded FontSpec.
 */
export async function loadAllFonts(): Promise<Map<string, FontSpec>> {
  const roles = Object.keys(FONT_CHAINS);
  const results = new Map<string, FontSpec>();
  const warnings: string[] = [];

  const loadPromises = roles.map(async (role) => {
    try {
      const spec = await loadFontWithFallback(role);
      results.set(role, spec);
      const chain = FONT_CHAINS[role];
      if (fontKey(spec) !== fontKey(chain.primary)) {
        warnings.push(`${role}: using ${spec.family} ${spec.style} (fallback)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`${role}: FAILED - ${message}`);
    }
  });

  await Promise.all(loadPromises);

  if (warnings.length > 0) {
    figma.notify(`Font warnings:\n${warnings.join('\n')}`, { timeout: 5000 });
  }

  return results;
}

/**
 * Get the font name for applying to text nodes.
 */
export function getFontName(spec: FontSpec): FontName {
  return { family: spec.family, style: spec.style };
}

/**
 * Check if a specific font is available (already loaded).
 */
export function isFontLoaded(family: string, style: string): boolean {
  return loadedFonts.has(`${family}::${style}`);
}
