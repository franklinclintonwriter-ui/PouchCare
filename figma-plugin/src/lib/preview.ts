/**
 * Theme preview visualization system.
 * Creates "Foundations" page with 4 preview frames (1440x900 each).
 */

import { hexToFigmaRGB, createSolidPaint, meetsContrastAA } from './utils/colors';
import { loadFontWithFallback, getFontName } from './utils/fonts';
import { findOrCreatePage, findComponentSet } from './utils/guards';
import { applyAutoLayout, sendProgress } from './utils/figma-api';
import { getThemeColors } from './tokens';

// ---------------------------------------------------------------------------
// Helper: create text node
// ---------------------------------------------------------------------------

async function createLabel(
  text: string,
  fontRole: string,
  size: number,
  colorHex: string,
): Promise<TextNode> {
  const textNode = figma.createText();
  const font = await loadFontWithFallback(fontRole);
  textNode.fontName = getFontName(font);
  textNode.fontSize = size;
  textNode.fills = [createSolidPaint(colorHex)];
  textNode.characters = text;
  return textNode;
}

// ---------------------------------------------------------------------------
// Helper: create color swatch
// ---------------------------------------------------------------------------

async function createColorSwatch(
  name: string,
  hex: string,
  textColor: string,
): Promise<FrameNode> {
  const swatch = figma.createFrame();
  swatch.name = `Swatch/${name}`;
  swatch.resize(120, 100);
  applyAutoLayout(swatch, {
    direction: 'VERTICAL',
    spacing: 4,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });
  swatch.primaryAxisSizingMode = 'AUTO';
  swatch.fills = [];

  // Color rectangle
  const rect = figma.createRectangle();
  rect.name = 'Color';
  rect.resize(80, 80);
  rect.fills = [createSolidPaint(hex)];
  rect.cornerRadius = 8;
  rect.strokes = [{ type: 'SOLID', color: hexToFigmaRGB('#ffffff'), opacity: 0.1 }];
  rect.strokeWeight = 1;
  swatch.appendChild(rect);

  // Label
  const label = await createLabel(name, 'caption', 10, textColor);
  label.name = 'Name';
  swatch.appendChild(label);

  // Hex value
  const hexLabel = await createLabel(hex, 'mono', 10, textColor);
  hexLabel.name = 'Hex';
  swatch.appendChild(hexLabel);

  return swatch;
}

// ---------------------------------------------------------------------------
// Create a single theme preview frame
// ---------------------------------------------------------------------------

async function createThemePreviewFrame(
  themeName: ThemeName,
  colors: Record<ColorTokenKey, string>,
  xOffset: number,
  yOffset: number,
): Promise<{ frame: FrameNode; nodeCount: number; contrastWarnings: string[] }> {
  let nodeCount = 0;
  const contrastWarnings: string[] = [];

  const frame = figma.createFrame();
  frame.name = `${themeName} Theme Preview`;
  frame.resize(1440, 900);
  frame.fills = [createSolidPaint(colors.bg)];
  frame.cornerRadius = 16;
  frame.strokes = [createSolidPaint(colors.border)];
  frame.strokeWeight = 1;
  frame.x = xOffset;
  frame.y = yOffset;

  applyAutoLayout(frame, {
    direction: 'VERTICAL',
    padding: 48,
    spacing: 32,
  });
  frame.primaryAxisSizingMode = 'AUTO';

  // Theme title
  const titleText = `${themeName} Theme Preview`;
  const title = await createLabel(titleText, 'display', 48, colors.accent);
  title.name = 'ThemeTitle';
  frame.appendChild(title);
  nodeCount++;

  // Divider
  const divider1 = figma.createRectangle();
  divider1.name = 'Divider';
  divider1.resize(1344, 1);
  divider1.fills = [createSolidPaint(colors.border)];
  frame.appendChild(divider1);
  nodeCount++;

  // --- Color Scale Section ---
  const colorSection = figma.createFrame();
  colorSection.name = 'ColorScale';
  colorSection.fills = [];
  applyAutoLayout(colorSection, { direction: 'VERTICAL', spacing: 16 });
  colorSection.primaryAxisSizingMode = 'AUTO';
  colorSection.counterAxisSizingMode = 'AUTO';

  const colorTitle = await createLabel('Color Scale', 'displaySemiBold', 24, colors.text);
  colorSection.appendChild(colorTitle);
  nodeCount++;

  // Color swatches grid
  const swatchGrid = figma.createFrame();
  swatchGrid.name = 'SwatchGrid';
  swatchGrid.fills = [];
  swatchGrid.resize(1344, 240);
  applyAutoLayout(swatchGrid, { direction: 'HORIZONTAL', spacing: 8 });
  swatchGrid.layoutWrap = 'WRAP';
  swatchGrid.counterAxisSpacing = 8;

  const colorKeys: ColorTokenKey[] = [
    'bg', 'bgElevated', 'panel', 'surface', 'text', 'textMuted', 'textInverse',
    'border', 'borderHover', 'accent', 'accent2', 'success', 'warn', 'danger',
  ];

  for (const key of colorKeys) {
    const swatch = await createColorSwatch(key, colors[key], colors.textMuted);
    swatchGrid.appendChild(swatch);
    nodeCount++;
  }
  colorSection.appendChild(swatchGrid);
  frame.appendChild(colorSection);

  // Divider
  const divider2 = figma.createRectangle();
  divider2.name = 'Divider2';
  divider2.resize(1344, 1);
  divider2.fills = [createSolidPaint(colors.border)];
  frame.appendChild(divider2);
  nodeCount++;

  // --- Typography Section ---
  const typeSection = figma.createFrame();
  typeSection.name = 'Typography';
  typeSection.fills = [];
  applyAutoLayout(typeSection, { direction: 'VERTICAL', spacing: 12 });
  typeSection.primaryAxisSizingMode = 'AUTO';
  typeSection.counterAxisSizingMode = 'AUTO';

  const typeTitle = await createLabel('Typography', 'displaySemiBold', 24, colors.text);
  typeSection.appendChild(typeTitle);
  nodeCount++;

  const typeSamples: Array<{ label: string; role: string; size: number; text: string }> = [
    { label: 'H1: ', role: 'display', size: 48, text: 'The quick brown fox' },
    { label: 'H2: ', role: 'displaySemiBold', size: 32, text: 'The quick brown fox' },
    { label: 'H3: ', role: 'displaySemiBold', size: 24, text: 'The quick brown fox' },
    { label: 'Body: ', role: 'body', size: 16, text: 'The quick brown fox jumps over the lazy dog' },
    { label: 'Mono: ', role: 'mono', size: 14, text: '0123456789 ABCDEF const x = 42;' },
  ];

  for (const sample of typeSamples) {
    const sampleRow = figma.createFrame();
    sampleRow.name = `TypeSample/${sample.label.trim()}`;
    sampleRow.fills = [];
    applyAutoLayout(sampleRow, {
      direction: 'HORIZONTAL',
      spacing: 8,
      crossAlignment: 'CENTER',
    });
    sampleRow.primaryAxisSizingMode = 'AUTO';
    sampleRow.counterAxisSizingMode = 'AUTO';

    const labelNode = await createLabel(sample.label, 'bodySmall', 12, colors.textMuted);
    sampleRow.appendChild(labelNode);

    const textNode = await createLabel(sample.text, sample.role, sample.size, colors.text);
    sampleRow.appendChild(textNode);

    typeSection.appendChild(sampleRow);
    nodeCount++;
  }
  frame.appendChild(typeSection);

  // Divider
  const divider3 = figma.createRectangle();
  divider3.name = 'Divider3';
  divider3.resize(1344, 1);
  divider3.fills = [createSolidPaint(colors.border)];
  frame.appendChild(divider3);
  nodeCount++;

  // --- Elevation Section ---
  const elevationSection = figma.createFrame();
  elevationSection.name = 'Elevation';
  elevationSection.fills = [];
  applyAutoLayout(elevationSection, { direction: 'VERTICAL', spacing: 16 });
  elevationSection.primaryAxisSizingMode = 'AUTO';
  elevationSection.counterAxisSizingMode = 'AUTO';

  const elevTitle = await createLabel('Elevation & Effects', 'displaySemiBold', 24, colors.text);
  elevationSection.appendChild(elevTitle);
  nodeCount++;

  const elevRow = figma.createFrame();
  elevRow.name = 'ElevationSamples';
  elevRow.fills = [];
  applyAutoLayout(elevRow, { direction: 'HORIZONTAL', spacing: 24 });
  elevRow.primaryAxisSizingMode = 'AUTO';
  elevRow.counterAxisSizingMode = 'AUTO';

  const shadowSpecs: Array<{
    label: string;
    shadow: DropShadowEffect;
  }> = [
    {
      label: 'Shadow sm',
      shadow: {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 1 },
        radius: 2,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      },
    },
    {
      label: 'Shadow md',
      shadow: {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 4 },
        radius: 6,
        spread: -1,
        visible: true,
        blendMode: 'NORMAL',
      },
    },
    {
      label: 'Shadow lg',
      shadow: {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 10 },
        radius: 15,
        spread: -3,
        visible: true,
        blendMode: 'NORMAL',
      },
    },
  ];

  for (const spec of shadowSpecs) {
    const sample = figma.createFrame();
    sample.name = spec.label;
    sample.resize(120, 80);
    sample.fills = [createSolidPaint(colors.surface)];
    sample.cornerRadius = 8;
    sample.effects = [spec.shadow];

    const label = await createLabel(spec.label, 'caption', 10, colors.textMuted);
    label.x = 8;
    label.y = 60;
    sample.appendChild(label);

    elevRow.appendChild(sample);
    nodeCount++;
  }

  // Glow samples (for non-Minimal themes)
  if (themeName !== 'LightMinimal') {
    const accentRgb = hexToFigmaRGB(colors.accent);
    const glowSpecs: Array<{ label: string; blur: number; opacity: number }> = [
      { label: 'Glow sm', blur: 8, opacity: 0.25 },
      { label: 'Glow md', blur: 16, opacity: 0.35 },
      { label: 'Glow lg', blur: 32, opacity: 0.45 },
    ];

    for (const spec of glowSpecs) {
      const sample = figma.createFrame();
      sample.name = spec.label;
      sample.resize(120, 80);
      sample.fills = [createSolidPaint(colors.surface)];
      sample.cornerRadius = 8;
      sample.effects = [
        {
          type: 'DROP_SHADOW',
          color: { ...accentRgb, a: spec.opacity },
          offset: { x: 0, y: 0 },
          radius: spec.blur,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];

      const label = await createLabel(spec.label, 'caption', 10, colors.textMuted);
      label.x = 8;
      label.y = 60;
      sample.appendChild(label);

      elevRow.appendChild(sample);
      nodeCount++;
    }
  }

  elevationSection.appendChild(elevRow);
  frame.appendChild(elevationSection);

  // --- Contrast Validation ---
  const contrastSection = figma.createFrame();
  contrastSection.name = 'ContrastValidation';
  contrastSection.fills = [];
  applyAutoLayout(contrastSection, { direction: 'VERTICAL', spacing: 8 });
  contrastSection.primaryAxisSizingMode = 'AUTO';
  contrastSection.counterAxisSizingMode = 'AUTO';

  const contrastTitle = await createLabel('Contrast Validation', 'displaySemiBold', 20, colors.text);
  contrastSection.appendChild(contrastTitle);

  const contrastPairs: Array<{ fg: ColorTokenKey; bg: ColorTokenKey }> = [
    { fg: 'text', bg: 'bg' },
    { fg: 'textMuted', bg: 'bg' },
    { fg: 'accent', bg: 'bg' },
    { fg: 'text', bg: 'surface' },
  ];

  for (const pair of contrastPairs) {
    const result = meetsContrastAA(colors[pair.fg], colors[pair.bg]);
    const icon = result.ratio >= 4.5 ? '\u2705' : result.ratio >= 3 ? '\u26A0\uFE0F' : '\u274C';
    const line = `${icon} ${pair.fg}/${pair.bg}: ${result.ratio}:1 (${result.level})`;

    if (!result.passes) {
      contrastWarnings.push(`${themeName}: ${pair.fg}/${pair.bg} = ${result.ratio}:1`);
    }

    const contrastLabel = await createLabel(line, 'bodySmall', 12, colors.textMuted);
    contrastSection.appendChild(contrastLabel);
    nodeCount++;
  }
  frame.appendChild(contrastSection);

  // --- Component Samples ---
  const componentSection = figma.createFrame();
  componentSection.name = 'ComponentSamples';
  componentSection.fills = [];
  applyAutoLayout(componentSection, { direction: 'VERTICAL', spacing: 16 });
  componentSection.primaryAxisSizingMode = 'AUTO';
  componentSection.counterAxisSizingMode = 'AUTO';

  const compTitle = await createLabel('Component Samples', 'displaySemiBold', 20, colors.text);
  componentSection.appendChild(compTitle);

  const compRow = figma.createFrame();
  compRow.name = 'ComponentRow';
  compRow.fills = [];
  applyAutoLayout(compRow, { direction: 'HORIZONTAL', spacing: 16 });
  compRow.primaryAxisSizingMode = 'AUTO';
  compRow.counterAxisSizingMode = 'AUTO';

  // Map theme names to variant names for component lookup
  const variantMap: Record<ThemeName, CardVariant> = {
    DarkNeon: 'Neon',
    LightMinimal: 'Minimal',
    EsportsBlackRed: 'Cyberpunk',
    CyberpunkPurpleCyan: 'Glass',
  };
  const variantName = variantMap[themeName];

  const cardTypes = ['Card/Generic', 'Card/Stats', 'Card/Game', 'Card/FAQ'];
  for (const cardType of cardTypes) {
    const componentSet = findComponentSet(cardType);
    if (componentSet) {
      const targetVariant = componentSet.children.find(
        (child) => child.type === 'COMPONENT' && child.name.includes(`Theme=${variantName}`),
      ) as ComponentNode | undefined;

      if (targetVariant) {
        const instance = targetVariant.createInstance();
        compRow.appendChild(instance);
        nodeCount++;
      }
    } else {
      // Fallback placeholder
      const placeholder = figma.createFrame();
      placeholder.name = `${cardType} (not created)`;
      placeholder.resize(200, 150);
      placeholder.fills = [createSolidPaint(colors.surface)];
      placeholder.cornerRadius = 8;
      compRow.appendChild(placeholder);
      nodeCount++;
    }
  }

  componentSection.appendChild(compRow);
  frame.appendChild(componentSection);

  return { frame, nodeCount, contrastWarnings };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createThemePreviews(): Promise<{
  nodeCount: number;
  contrastWarnings: string[];
}> {
  const page = findOrCreatePage('Foundations');
  const allThemeColors = getThemeColors();
  const themeNames: ThemeName[] = ['DarkNeon', 'LightMinimal', 'EsportsBlackRed', 'CyberpunkPurpleCyan'];

  let totalNodes = 0;
  const allWarnings: string[] = [];

  for (let i = 0; i < themeNames.length; i++) {
    const themeName = themeNames[i];
    sendProgress('previews', i, themeNames.length, `Creating ${themeName} preview...`);

    const xOffset = (i % 2) * 1500;
    const yOffset = Math.floor(i / 2) * 1000;

    const result = await createThemePreviewFrame(
      themeName,
      allThemeColors[themeName],
      xOffset,
      yOffset,
    );

    page.appendChild(result.frame);
    totalNodes += result.nodeCount;
    allWarnings.push(...result.contrastWarnings);
  }

  if (allWarnings.length > 0) {
    figma.notify(`Contrast warnings found:\n${allWarnings.join('\n')}`, {
      timeout: 5000,
      error: true,
    });
  }

  figma.notify(`Theme previews created: ${totalNodes} nodes across ${themeNames.length} themes`, {
    timeout: 3000,
  });

  return { nodeCount: totalNodes, contrastWarnings: allWarnings };
}
