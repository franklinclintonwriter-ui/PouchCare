/**
 * Color utility functions: hex/RGB conversion, contrast checking, opacity helpers.
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface RGBAColor extends RGBColor {
  a: number;
}

/** Convert hex string (#RRGGBB or #RGB) to Figma-compatible RGB (0-1 range). */
export function hexToFigmaRGB(hex: string): RGB {
  const clean = hex.replace('#', '');
  let r: number;
  let g: number;
  let b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return { r, g, b };
}

/** Convert Figma RGB (0-1 range) to hex string (#RRGGBB). */
export function figmaRGBToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(rgb.g * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(rgb.b * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

/** Convert hex to RGBA with opacity. */
export function hexToFigmaRGBA(hex: string, opacity: number): RGBA {
  const rgb = hexToFigmaRGB(hex);
  return { ...rgb, a: Math.max(0, Math.min(1, opacity)) };
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * Input: RGB values in 0-1 range.
 */
export function relativeLuminance(rgb: RGB): number {
  const linearize = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLin = linearize(rgb.r);
  const gLin = linearize(rgb.g);
  const bLin = linearize(rgb.b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculate contrast ratio between two colors per WCAG 2.1.
 * Returns ratio >= 1 (higher = more contrast).
 */
export function contrastRatio(color1: RGB, color2: RGB): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a fg/bg pair meets WCAG AA contrast (4.5:1 for normal, 3:1 for large text).
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): { passes: boolean; ratio: number; level: string } {
  const fgRGB = hexToFigmaRGB(foreground);
  const bgRGB = hexToFigmaRGB(background);
  const ratio = contrastRatio(fgRGB, bgRGB);
  const threshold = isLargeText ? 3.0 : 4.5;

  let level: string;
  if (ratio >= 7.0) {
    level = 'AAA';
  } else if (ratio >= 4.5) {
    level = 'AA';
  } else if (ratio >= 3.0) {
    level = 'AA-Large';
  } else {
    level = 'Fail';
  }

  return {
    passes: ratio >= threshold,
    ratio: Math.round(ratio * 10) / 10,
    level,
  };
}

/** Create a solid paint from a hex color. */
export function createSolidPaint(hex: string, opacity: number = 1): SolidPaint {
  return {
    type: 'SOLID',
    color: hexToFigmaRGB(hex),
    opacity: Math.max(0, Math.min(1, opacity)),
  };
}

/** Create a gradient paint for overlays. */
export function createLinearGradient(
  fromHex: string,
  toHex: string,
  fromOpacity: number = 0,
  toOpacity: number = 1,
): GradientPaint {
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [0, 1, 0],
      [-1, 0, 1],
    ],
    gradientStops: [
      {
        position: 0,
        color: hexToFigmaRGBA(fromHex, fromOpacity),
        boundVariables: {},
      } as ColorStop,
      {
        position: 1,
        color: hexToFigmaRGBA(toHex, toOpacity),
        boundVariables: {},
      } as ColorStop,
    ],
  };
}
