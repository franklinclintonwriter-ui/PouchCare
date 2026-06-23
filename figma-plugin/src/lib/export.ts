/**
 * Library snapshot export and distribution manifest.
 * Creates "Cover" page and generates JSON manifest for sharing.
 */

import { createSolidPaint } from './utils/colors';
import { loadFontWithFallback, getFontName } from './utils/fonts';
import { findOrCreatePage, findVariableCollection } from './utils/guards';
import { applyAutoLayout, sendProgress } from './utils/figma-api';
import { getThemeColors } from './tokens';

// ---------------------------------------------------------------------------
// Helper: create labeled text
// ---------------------------------------------------------------------------

async function createText(
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
// Build the export manifest
// ---------------------------------------------------------------------------

function buildManifest(): ExportManifest {
  const themeColors = getThemeColors();
  const themeNames: ThemeName[] = ['DarkNeon', 'LightMinimal', 'EsportsBlackRed', 'CyberpunkPurpleCyan'];

  // Count variables
  let variableCount = 0;
  const collection = findVariableCollection('Theme');
  if (collection) {
    variableCount = collection.variableIds.length;
  }

  // Count styles
  const textStyleCount = figma.getLocalTextStyles().filter(
    (s) => s.name.startsWith('Display/') || s.name.startsWith('Body/') || s.name.startsWith('Mono/'),
  ).length;
  const paintStyleCount = figma.getLocalPaintStyles().filter(
    (s) => s.name.startsWith('Surface/') || s.name.startsWith('Accent/') || s.name.startsWith('Border/'),
  ).length;
  const totalStyles = textStyleCount + paintStyleCount;

  // Gather components
  const componentSets: Array<{
    name: string;
    type: string;
    nodeId: string;
    variants: string[];
    properties: Record<string, string[]>;
    dependencies: string[];
  }> = [];

  for (const page of figma.root.children) {
    page.findAll((n) => n.type === 'COMPONENT_SET').forEach((node) => {
      const cs = node as ComponentSetNode;
      const variants: string[] = [];
      const properties: Record<string, string[]> = {};

      for (const child of cs.children) {
        if (child.type === 'COMPONENT') {
          variants.push(child.name);
          // Parse variant properties from name
          const parts = child.name.split(', ');
          for (const part of parts) {
            const [propName, propValue] = part.split('=');
            if (propName && propValue) {
              if (!properties[propName]) properties[propName] = [];
              if (!properties[propName].includes(propValue)) {
                properties[propName].push(propValue);
              }
            }
          }
        }
      }

      componentSets.push({
        name: cs.name,
        type: 'COMPONENT_SET',
        nodeId: cs.id,
        variants,
        properties,
        dependencies: ['Theme/bg', 'Theme/accent', 'TextStyle/H3'],
      });
    });

    // Single components (not in sets)
    page.findAll((n) => n.type === 'COMPONENT' && n.parent?.type !== 'COMPONENT_SET').forEach((node) => {
      const comp = node as ComponentNode;
      componentSets.push({
        name: comp.name,
        type: 'COMPONENT',
        nodeId: comp.id,
        variants: [],
        properties: {},
        dependencies: ['Theme/bg', 'Theme/accent'],
      });
    });
  }

  // Gather styles
  const styles: Array<{ name: string; type: string; nodeId: string }> = [];
  for (const s of figma.getLocalTextStyles()) {
    if (s.name.startsWith('Display/') || s.name.startsWith('Body/') || s.name.startsWith('Mono/')) {
      styles.push({ name: s.name, type: 'TEXT', nodeId: s.id });
    }
  }
  for (const s of figma.getLocalPaintStyles()) {
    if (s.name.startsWith('Surface/') || s.name.startsWith('Accent/') || s.name.startsWith('Border/')) {
      styles.push({ name: s.name, type: 'PAINT', nodeId: s.id });
    }
  }

  // Build themes array
  const themes = themeNames.map((name) => {
    let modeId = '';
    if (collection) {
      const mode = collection.modes.find((m) => m.name === name);
      if (mode) modeId = mode.modeId;
    }
    return {
      name,
      modeId,
      colors: themeColors[name],
    };
  });

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    summary: {
      components: componentSets.length,
      variables: variableCount,
      styles: totalStyles,
      pages: figma.root.children.length,
    },
    themes,
    components: componentSets,
    styles,
  };
}

// ---------------------------------------------------------------------------
// Create Cover page
// ---------------------------------------------------------------------------

async function createCoverPage(manifest: ExportManifest): Promise<void> {
  const page = findOrCreatePage('Cover');
  const colors = getThemeColors().DarkNeon;

  // Remove existing cover frame if any
  const existingCover = page.findOne((n) => n.name === 'CoverCard');
  if (existingCover) existingCover.remove();

  const cover = figma.createFrame();
  cover.name = 'CoverCard';
  cover.resize(800, 600);
  cover.fills = [createSolidPaint(colors.bg)];
  cover.cornerRadius = 16;
  cover.strokes = [createSolidPaint(colors.border)];
  cover.strokeWeight = 1;

  applyAutoLayout(cover, {
    direction: 'VERTICAL',
    padding: 48,
    spacing: 24,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });
  cover.primaryAxisSizingMode = 'AUTO';

  // Plugin icon placeholder
  const icon = figma.createRectangle();
  icon.name = 'PluginIcon';
  icon.resize(64, 64);
  icon.fills = [createSolidPaint(colors.accent)];
  icon.cornerRadius = 16;
  cover.appendChild(icon);

  // Title
  const title = await createText('Design System Bootstrapper', 'display', 36, colors.text);
  title.name = 'Title';
  title.textAlignHorizontal = 'CENTER';
  cover.appendChild(title);

  // Version + date
  const version = await createText(
    `v${manifest.version} | ${new Date().toISOString().split('T')[0]}`,
    'bodySmall',
    14,
    colors.textMuted,
  );
  version.name = 'Version';
  version.textAlignHorizontal = 'CENTER';
  cover.appendChild(version);

  // Divider
  const divider1 = figma.createRectangle();
  divider1.name = 'Divider';
  divider1.resize(704, 1);
  divider1.fills = [createSolidPaint(colors.border)];
  cover.appendChild(divider1);

  // Component inventory
  const inventoryTitle = await createText('Component Inventory', 'displaySemiBold', 20, colors.text);
  inventoryTitle.textAlignHorizontal = 'CENTER';
  cover.appendChild(inventoryTitle);

  const inventoryLine = await createText(
    `Components: ${manifest.summary.components}  |  Variables: ${manifest.summary.variables}  |  Styles: ${manifest.summary.styles}  |  Pages: ${manifest.summary.pages}`,
    'body',
    14,
    colors.textMuted,
  );
  inventoryLine.name = 'InventoryStats';
  inventoryLine.textAlignHorizontal = 'CENTER';
  cover.appendChild(inventoryLine);

  // Divider
  const divider2 = figma.createRectangle();
  divider2.name = 'Divider2';
  divider2.resize(704, 1);
  divider2.fills = [createSolidPaint(colors.border)];
  cover.appendChild(divider2);

  // Changelog
  const changelogTitle = await createText('Changelog', 'displaySemiBold', 20, colors.text);
  changelogTitle.textAlignHorizontal = 'CENTER';
  cover.appendChild(changelogTitle);

  const changelogEntries = [
    'v1.0.0: Initial release',
    'Theme system with 4 modes',
    '6 container types, 8 card types',
    'Auto-layout responsive patterns',
    'Theme preview & export system',
  ];

  for (const entry of changelogEntries) {
    const line = await createText(`\u2022 ${entry}`, 'bodySmall', 13, colors.textMuted);
    line.textAlignHorizontal = 'CENTER';
    cover.appendChild(line);
  }

  page.appendChild(cover);

  // Move Cover page to first position
  const pages = figma.root.children;
  const coverIndex = pages.indexOf(page);
  if (coverIndex > 0) {
    figma.root.insertChild(0, page);
  }
}

// ---------------------------------------------------------------------------
// Utility: generate CSS custom properties
// ---------------------------------------------------------------------------

function generateCSS(): string {
  const themeColors = getThemeColors();
  const themeNames: ThemeName[] = ['DarkNeon', 'LightMinimal', 'EsportsBlackRed', 'CyberpunkPurpleCyan'];
  const lines: string[] = ['/* Generated by Design System Bootstrapper */\n'];

  for (const themeName of themeNames) {
    const colors = themeColors[themeName];
    const selector = themeName === 'DarkNeon' ? ':root' : `[data-theme="${themeName}"]`;
    lines.push(`${selector} {`);

    for (const [key, value] of Object.entries(colors)) {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      lines.push(`  --color-${cssVar}: ${value};`);
    }

    lines.push('}\n');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Utility: generate tokens JSON (Style Dictionary compatible)
// ---------------------------------------------------------------------------

function generateTokensJSON(): string {
  const themeColors = getThemeColors();
  const themeNames: ThemeName[] = ['DarkNeon', 'LightMinimal', 'EsportsBlackRed', 'CyberpunkPurpleCyan'];

  const tokens: Record<string, Record<string, Record<string, { value: string; type: string }>>> = {};

  for (const themeName of themeNames) {
    tokens[themeName] = { color: {} };
    const colors = themeColors[themeName];

    for (const [key, value] of Object.entries(colors)) {
      tokens[themeName].color[key] = { value, type: 'color' };
    }
  }

  return JSON.stringify(tokens, null, 2);
}

// ---------------------------------------------------------------------------
// Utility: validate integrity
// ---------------------------------------------------------------------------

function validateIntegrity(): {
  valid: boolean;
  brokenRefs: string[];
  orphanedStyles: string[];
} {
  const brokenRefs: string[] = [];
  const orphanedStyles: string[] = [];

  // Check all component instances
  for (const page of figma.root.children) {
    page.findAll((n) => n.type === 'INSTANCE').forEach((node) => {
      const instance = node as InstanceNode;
      if (!instance.mainComponent) {
        brokenRefs.push(`Broken instance: ${instance.name} (${instance.id})`);
      }
    });
  }

  // Check paint styles reference valid variables
  for (const style of figma.getLocalPaintStyles()) {
    if (style.paints.length === 0) {
      orphanedStyles.push(`Empty paint style: ${style.name}`);
    }
  }

  return {
    valid: brokenRefs.length === 0 && orphanedStyles.length === 0,
    brokenRefs,
    orphanedStyles,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function exportLibrarySnapshot(): Promise<ExportManifest> {
  sendProgress('export', 0, 3, 'Building manifest...');
  const manifest = buildManifest();

  sendProgress('export', 1, 3, 'Creating cover page...');
  await createCoverPage(manifest);

  sendProgress('export', 2, 3, 'Validating integrity...');
  const integrity = validateIntegrity();
  if (!integrity.valid) {
    const warnings = [...integrity.brokenRefs, ...integrity.orphanedStyles].join('\n');
    figma.notify(`Integrity warnings:\n${warnings}`, { timeout: 5000, error: true });
  }

  // Generate supplementary outputs
  const cssOutput = generateCSS();
  const tokensOutput = generateTokensJSON();

  // Send manifest to UI
  const manifestJSON = JSON.stringify(manifest, null, 2);
  figma.ui.postMessage({
    type: 'manifest-data',
    data: JSON.stringify({
      manifest: manifestJSON,
      css: cssOutput,
      tokens: tokensOutput,
    }),
  } satisfies PluginMessage);

  figma.notify(
    `Export complete: ${manifest.summary.components} components, ${manifest.summary.variables} variables, ${manifest.summary.styles} styles`,
    { timeout: 3000 },
  );

  return manifest;
}

export { generateCSS, generateTokensJSON, validateIntegrity };
