/**
 * Token system: theme variables, color scales, text styles, paint styles.
 * Creates a "Theme" variable collection with 4 modes and all associated styles.
 */

import { hexToFigmaRGB, createSolidPaint, meetsContrastAA } from './utils/colors';
import { loadAllFonts, getFontName } from './utils/fonts';
import {
  findVariableCollection,
  findVariableByName,
  findTextStyle,
  findPaintStyle,
  countExistingVariables,
} from './utils/guards';
import { sendProgress } from './utils/figma-api';

// ---------------------------------------------------------------------------
// Theme color definitions
// ---------------------------------------------------------------------------

const THEME_COLORS: Record<ThemeName, Record<ColorTokenKey, string>> = {
  DarkNeon: {
    bg: '#0b0f14',
    bgElevated: '#111827',
    panel: '#121826',
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textInverse: '#0f172a',
    border: '#1e293b',
    borderHover: '#334155',
    accent: '#22d3ee',
    accent2: '#a78bfa',
    success: '#34d399',
    warn: '#f59e0b',
    danger: '#ef4444',
  },
  LightMinimal: {
    bg: '#f8fafc',
    bgElevated: '#ffffff',
    panel: '#ffffff',
    surface: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    textInverse: '#f8fafc',
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    accent: '#0ea5e9',
    accent2: '#6366f1',
    success: '#16a34a',
    warn: '#d97706',
    danger: '#dc2626',
  },
  EsportsBlackRed: {
    bg: '#0a0a0a',
    bgElevated: '#171717',
    panel: '#141414',
    surface: '#262626',
    text: '#f5f5f5',
    textMuted: '#a3a3a3',
    textInverse: '#0a0a0a',
    border: '#262626',
    borderHover: '#404040',
    accent: '#ef4444',
    accent2: '#22d3ee',
    success: '#22c55e',
    warn: '#f59e0b',
    danger: '#ef4444',
  },
  CyberpunkPurpleCyan: {
    bg: '#0b1020',
    bgElevated: '#151a2e',
    panel: '#151a2e',
    surface: '#1e293b',
    text: '#e6e6ff',
    textMuted: '#9aa0c3',
    textInverse: '#0b1020',
    border: '#2a3352',
    borderHover: '#3d4a6b',
    accent: '#22d3ee',
    accent2: '#d946ef',
    success: '#10b981',
    warn: '#fbbf24',
    danger: '#f43f5e',
  },
};

const THEME_NUMERIC: Record<ThemeName, Record<NumericTokenKey, number>> = {
  DarkNeon: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    spacingUnit: 4,
    shadowBlur: 16,
    glowIntensity: 0.35,
  },
  LightMinimal: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    spacingUnit: 4,
    shadowBlur: 8,
    glowIntensity: 0,
  },
  EsportsBlackRed: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    spacingUnit: 4,
    shadowBlur: 12,
    glowIntensity: 0.3,
  },
  CyberpunkPurpleCyan: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    spacingUnit: 4,
    shadowBlur: 20,
    glowIntensity: 0.4,
  },
};

const THEME_STRINGS: Record<ThemeName, Record<StringTokenKey, string>> = {
  DarkNeon: { fontDisplay: 'Orbitron', fontMono: 'JetBrains Mono' },
  LightMinimal: { fontDisplay: 'Orbitron', fontMono: 'JetBrains Mono' },
  EsportsBlackRed: { fontDisplay: 'Orbitron', fontMono: 'JetBrains Mono' },
  CyberpunkPurpleCyan: { fontDisplay: 'Orbitron', fontMono: 'JetBrains Mono' },
};

// ---------------------------------------------------------------------------
// Text style definitions
// ---------------------------------------------------------------------------

interface TextStyleDef {
  name: string;
  fontRole: string;
  size: number;
  lineHeight: number;
  weight: number;
  letterSpacing: number;
  textCase?: TextCase;
}

const TEXT_STYLE_DEFS: TextStyleDef[] = [
  {
    name: 'Display/H1',
    fontRole: 'display',
    size: 48,
    lineHeight: 56,
    weight: 700,
    letterSpacing: -0.02,
  },
  {
    name: 'Display/H2',
    fontRole: 'displaySemiBold',
    size: 32,
    lineHeight: 40,
    weight: 600,
    letterSpacing: -0.01,
  },
  {
    name: 'Display/H3',
    fontRole: 'displaySemiBold',
    size: 24,
    lineHeight: 32,
    weight: 600,
    letterSpacing: 0,
  },
  {
    name: 'Body/Regular',
    fontRole: 'body',
    size: 16,
    lineHeight: 24,
    weight: 400,
    letterSpacing: 0,
  },
  {
    name: 'Body/Small',
    fontRole: 'bodySmall',
    size: 14,
    lineHeight: 20,
    weight: 400,
    letterSpacing: 0,
  },
  {
    name: 'Body/Caption',
    fontRole: 'caption',
    size: 12,
    lineHeight: 16,
    weight: 400,
    letterSpacing: 0.05,
    textCase: 'UPPER',
  },
  {
    name: 'Mono/Data',
    fontRole: 'mono',
    size: 14,
    lineHeight: 20,
    weight: 400,
    letterSpacing: 0,
  },
];

// ---------------------------------------------------------------------------
// Paint style definitions
// ---------------------------------------------------------------------------

interface PaintStyleDef {
  name: string;
  variableName: ColorTokenKey;
}

const PAINT_STYLE_DEFS: PaintStyleDef[] = [
  { name: 'Surface/Panel', variableName: 'panel' },
  { name: 'Surface/Card', variableName: 'surface' },
  { name: 'Accent/Primary', variableName: 'accent' },
  { name: 'Accent/Secondary', variableName: 'accent2' },
  { name: 'Border/Default', variableName: 'border' },
  { name: 'Border/Focus', variableName: 'borderHover' },
];

// ---------------------------------------------------------------------------
// Main token creation function
// ---------------------------------------------------------------------------

export async function createThemeVariablesAndStyles(): Promise<TokenSystemResult> {
  const existingCount = countExistingVariables();
  if (existingCount > 50) {
    figma.notify(
      `Warning: ${existingCount} variables already exist. Consider cleaning up first.`,
      { timeout: 5000 },
    );
  }

  // Load fonts
  sendProgress('tokens', 0, 4, 'Loading fonts...');
  const fontMap = await loadAllFonts();

  // Find or create collection
  sendProgress('tokens', 1, 4, 'Creating variable collection...');
  let collection = findVariableCollection('Theme');
  const isNewCollection = !collection;

  if (!collection) {
    collection = figma.variables.createVariableCollection('Theme');
  }

  // Ensure all 4 modes exist
  const themeNames: ThemeName[] = [
    'DarkNeon',
    'LightMinimal',
    'EsportsBlackRed',
    'CyberpunkPurpleCyan',
  ];
  const modes: ModeMap = new Map();

  for (let i = 0; i < themeNames.length; i++) {
    const themeName = themeNames[i];
    const existingMode = collection.modes.find((m) => m.name === themeName);
    if (existingMode) {
      modes.set(themeName, existingMode.modeId);
    } else {
      if (i === 0 && isNewCollection && collection.modes.length === 1) {
        // Rename the default mode
        collection.renameMode(collection.modes[0].modeId, themeName);
        modes.set(themeName, collection.modes[0].modeId);
      } else {
        const modeId = collection.addMode(themeName);
        modes.set(themeName, modeId);
      }
    }
  }

  // Create color variables
  sendProgress('tokens', 2, 4, 'Creating variables...');
  const variables: VariableMap = new Map();

  const colorKeys = Object.keys(THEME_COLORS.DarkNeon) as ColorTokenKey[];
  for (const key of colorKeys) {
    let variable = findVariableByName(collection, key);
    if (!variable) {
      variable = figma.variables.createVariable(key, collection, 'COLOR');
    }
    for (const themeName of themeNames) {
      const modeId = modes.get(themeName);
      if (modeId) {
        const hex = THEME_COLORS[themeName][key];
        variable.setValueForMode(modeId, hexToFigmaRGB(hex));
      }
    }
    variables.set(key, variable);
  }

  // Create numeric variables
  const numericKeys = Object.keys(THEME_NUMERIC.DarkNeon) as NumericTokenKey[];
  for (const key of numericKeys) {
    let variable = findVariableByName(collection, key);
    if (!variable) {
      variable = figma.variables.createVariable(key, collection, 'FLOAT');
    }
    for (const themeName of themeNames) {
      const modeId = modes.get(themeName);
      if (modeId) {
        variable.setValueForMode(modeId, THEME_NUMERIC[themeName][key]);
      }
    }
    variables.set(key, variable);
  }

  // Create string variables
  const stringKeys = Object.keys(THEME_STRINGS.DarkNeon) as StringTokenKey[];
  for (const key of stringKeys) {
    let variable = findVariableByName(collection, key);
    if (!variable) {
      variable = figma.variables.createVariable(key, collection, 'STRING');
    }
    for (const themeName of themeNames) {
      const modeId = modes.get(themeName);
      if (modeId) {
        variable.setValueForMode(modeId, THEME_STRINGS[themeName][key]);
      }
    }
    variables.set(key, variable);
  }

  // Create text styles
  sendProgress('tokens', 3, 4, 'Creating styles...');
  const textStyles: TextStyleMap = new Map();

  for (const def of TEXT_STYLE_DEFS) {
    let style = findTextStyle(def.name);
    if (!style) {
      style = figma.createTextStyle();
      style.name = def.name;
    }

    const loadedFont = fontMap.get(def.fontRole);
    if (loadedFont) {
      style.fontName = getFontName(loadedFont);
    }
    style.fontSize = def.size;
    style.lineHeight = { value: def.lineHeight, unit: 'PIXELS' };
    style.letterSpacing = {
      value: def.letterSpacing * 100,
      unit: 'PERCENT',
    };
    if (def.textCase) {
      style.textCase = def.textCase;
    }

    textStyles.set(def.name, style);
  }

  // Create paint styles
  const paintStyles: PaintStyleMap = new Map();

  for (const def of PAINT_STYLE_DEFS) {
    let style = findPaintStyle(def.name);
    if (!style) {
      style = figma.createPaintStyle();
      style.name = def.name;
    }

    const variable = variables.get(def.variableName);
    if (variable) {
      const defaultHex = THEME_COLORS.DarkNeon[def.variableName];
      style.paints = [createSolidPaint(defaultHex)];
    }

    paintStyles.set(def.name, style);
  }

  // Validate contrast ratios
  sendProgress('tokens', 4, 4, 'Validating contrast...');
  const contrastWarnings: string[] = [];
  for (const themeName of themeNames) {
    const colors = THEME_COLORS[themeName];
    const textBg = meetsContrastAA(colors.text, colors.bg);
    if (!textBg.passes) {
      contrastWarnings.push(`${themeName}: text/bg ratio ${textBg.ratio}:1 (FAIL)`);
    }
    const mutedBg = meetsContrastAA(colors.textMuted, colors.bg);
    if (!mutedBg.passes) {
      contrastWarnings.push(`${themeName}: textMuted/bg ratio ${mutedBg.ratio}:1 (FAIL)`);
    }
    const accentBg = meetsContrastAA(colors.accent, colors.bg);
    if (!accentBg.passes) {
      contrastWarnings.push(`${themeName}: accent/bg ratio ${accentBg.ratio}:1 (FAIL)`);
    }
  }

  if (contrastWarnings.length > 0) {
    figma.notify(`Contrast warnings:\n${contrastWarnings.join('\n')}`, { timeout: 5000 });
  }

  const totalVars = colorKeys.length + numericKeys.length + stringKeys.length;
  figma.notify(
    `Tokens created: ${totalVars} variables x ${themeNames.length} modes, ${textStyles.size} text styles, ${paintStyles.size} paint styles`,
    { timeout: 3000 },
  );

  return { collection, modes, variables, textStyles, paintStyles };
}

/** Export theme colors for use in other modules. */
export function getThemeColors(): Record<ThemeName, Record<ColorTokenKey, string>> {
  return THEME_COLORS;
}

/** Clear all theme variables and styles (reset). */
export { clearThemeVariables } from './utils/guards';
