/**
 * Component factory: containers and cards with full variant support.
 * Uses base factory pattern: createBaseFrame() -> applyTheme() -> applyAutoLayout() -> finalizeComponent()
 */

import { hexToFigmaRGBA, createSolidPaint } from './utils/colors';
import { loadFontWithFallback, getFontName } from './utils/fonts';
import { findComponentSet, findComponent } from './utils/guards';
import {
  applyAutoLayout,
  setFrameSizing,
  createDropShadow,
  createLayerBlur,
  sendProgress,
} from './utils/figma-api';
import { getThemeColors } from './tokens';

// ---------------------------------------------------------------------------
// Variant configurations
// ---------------------------------------------------------------------------

interface CardVariantConfig {
  borderWidth: number;
  borderDash: number;
  borderGap: number;
  borderColorKey: ColorTokenKey;
  radius: number;
  fillColorKey: ColorTokenKey;
  fillOpacity: number;
  glowColor: string | null;
  glowBlur: number;
  glowOpacity: number;
  blurRadius: number;
}

const VARIANT_CONFIGS: Record<CardVariant, CardVariantConfig> = {
  Minimal: {
    borderWidth: 1,
    borderDash: 0,
    borderGap: 0,
    borderColorKey: 'border',
    radius: 8,
    fillColorKey: 'panel',
    fillOpacity: 1,
    glowColor: null,
    glowBlur: 0,
    glowOpacity: 0,
    blurRadius: 0,
  },
  Neon: {
    borderWidth: 2,
    borderDash: 0,
    borderGap: 0,
    borderColorKey: 'accent',
    radius: 12,
    fillColorKey: 'panel',
    fillOpacity: 1,
    glowColor: '#22d3ee',
    glowBlur: 16,
    glowOpacity: 0.35,
    blurRadius: 0,
  },
  Cyberpunk: {
    borderWidth: 2,
    borderDash: 4,
    borderGap: 2,
    borderColorKey: 'accent2',
    radius: 8,
    fillColorKey: 'panel',
    fillOpacity: 1,
    glowColor: null,
    glowBlur: 0,
    glowOpacity: 0,
    blurRadius: 0,
  },
  Glass: {
    borderWidth: 0,
    borderDash: 0,
    borderGap: 0,
    borderColorKey: 'border',
    radius: 16,
    fillColorKey: 'panel',
    fillOpacity: 0.6,
    glowColor: null,
    glowBlur: 0,
    glowOpacity: 0,
    blurRadius: 8,
  },
};

// ---------------------------------------------------------------------------
// Helper: apply theme styling to a frame/component
// ---------------------------------------------------------------------------

function applyVariantStyle(
  node: FrameNode | ComponentNode,
  variant: CardVariant,
  themeName: ThemeName,
): void {
  const config = VARIANT_CONFIGS[variant];
  const colors = getThemeColors()[themeName];

  // Fill
  node.fills = [createSolidPaint(colors[config.fillColorKey], config.fillOpacity)];

  // Border
  if (config.borderWidth > 0) {
    node.strokes = [createSolidPaint(colors[config.borderColorKey])];
    node.strokeWeight = config.borderWidth;
    if (config.borderDash > 0) {
      node.dashPattern = [config.borderDash, config.borderGap];
    }
  } else {
    node.strokes = [];
  }

  // Radius
  node.cornerRadius = config.radius;

  // Effects
  const effects: Effect[] = [];

  // Glow (Neon variant)
  if (config.glowColor) {
    effects.push(
      createDropShadow(
        hexToFigmaRGBA(config.glowColor, config.glowOpacity),
        0,
        0,
        config.glowBlur,
        0,
      ),
    );
  }

  // Blur (Glass variant)
  if (config.blurRadius > 0) {
    effects.push(createLayerBlur(config.blurRadius));
  }

  node.effects = effects;
}

// ---------------------------------------------------------------------------
// Helper: create text node
// ---------------------------------------------------------------------------

async function createTextNode(
  text: string,
  fontRole: string,
  size: number,
  colorHex: string,
): Promise<TextNode> {
  const textNode = figma.createText();
  const fontSpec = await loadFontWithFallback(fontRole);
  textNode.fontName = getFontName(fontSpec);
  textNode.fontSize = size;
  textNode.fills = [createSolidPaint(colorHex)];
  textNode.characters = text;
  return textNode;
}

// ---------------------------------------------------------------------------
// Helper: create button
// ---------------------------------------------------------------------------

async function createButton(
  label: string,
  bgHex: string,
  textHex: string,
  radius: number = 8,
): Promise<FrameNode> {
  const btn = figma.createFrame();
  btn.name = 'Button';
  btn.fills = [createSolidPaint(bgHex)];
  btn.cornerRadius = radius;

  applyAutoLayout(btn, {
    direction: 'HORIZONTAL',
    padding: 12,
    paddingLeft: 16,
    paddingRight: 16,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });

  const textNode = await createTextNode(label, 'body', 14, textHex);
  textNode.name = 'Label';
  btn.appendChild(textNode);

  return btn;
}

// ---------------------------------------------------------------------------
// Helper: create placeholder image frame
// ---------------------------------------------------------------------------

function createImagePlaceholder(
  width: number,
  height: number,
  fillHex: string,
): FrameNode {
  const frame = figma.createFrame();
  frame.name = 'ImagePlaceholder';
  frame.resize(width, height);
  frame.fills = [createSolidPaint(fillHex)];
  frame.cornerRadius = 8;
  frame.clipsContent = true;

  // Add icon placeholder (centered cross)
  const icon = figma.createRectangle();
  icon.name = 'Icon';
  icon.resize(40, 40);
  icon.fills = [createSolidPaint(fillHex, 0.5)];
  icon.x = (width - 40) / 2;
  icon.y = (height - 40) / 2;
  frame.appendChild(icon);

  return frame;
}

// ---------------------------------------------------------------------------
// Helper: create chip
// ---------------------------------------------------------------------------

async function createChip(
  label: string,
  bgHex: string,
  textHex: string,
): Promise<FrameNode> {
  const chip = figma.createFrame();
  chip.name = `Chip/${label}`;
  chip.fills = [createSolidPaint(bgHex, 0.15)];
  chip.cornerRadius = 4;

  applyAutoLayout(chip, {
    direction: 'HORIZONTAL',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });

  const textNode = await createTextNode(label, 'caption', 12, textHex);
  textNode.name = 'Label';
  chip.appendChild(textNode);

  return chip;
}

// ---------------------------------------------------------------------------
// Container factories
// ---------------------------------------------------------------------------

function createContainerCentered(): ComponentNode | ComponentSetNode {
  const existing = findComponent('Container/Centered');
  if (existing) return existing;

  const component = figma.createComponent();
  component.name = 'Container/Centered';
  component.resize(1200, 400);
  component.fills = [];

  applyAutoLayout(component, {
    direction: 'VERTICAL',
    padding: 32,
    spacing: 24,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });
  setFrameSizing(component, 'HUG', 'FIXED');
  component.counterAxisSizingMode = 'FIXED';

  component.description = 'Max-width centered container with responsive padding. Primary content wrapper.';

  return component;
}

function createSectionFullBleed(): ComponentNode | ComponentSetNode {
  const existing = findComponent('Section/FullBleed');
  if (existing) return existing;

  const colors = getThemeColors().DarkNeon;
  const component = figma.createComponent();
  component.name = 'Section/FullBleed';
  component.resize(1440, 400);
  component.fills = [createSolidPaint(colors.bg)];

  applyAutoLayout(component, {
    direction: 'VERTICAL',
    paddingTop: 64,
    paddingBottom: 64,
    paddingLeft: 32,
    paddingRight: 32,
    spacing: 32,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });
  component.primaryAxisSizingMode = 'AUTO';

  component.description = 'Full-width section with background fill. Use for hero sections and CTAs.';

  return component;
}

function createLayoutTwoColumn(): ComponentNode | ComponentSetNode {
  const existing = findComponentSet('Layout/TwoColumn');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const layoutConfigs: Array<{
    name: string;
    leftRatio: number;
    rightRatio: number;
  }> = [
    { name: 'Default', leftRatio: 0.6, rightRatio: 0.4 },
    { name: 'Reversed', leftRatio: 0.4, rightRatio: 0.6 },
    { name: 'Stacked', leftRatio: 1, rightRatio: 1 },
  ];

  for (const config of layoutConfigs) {
    const component = figma.createComponent();
    component.name = `Layout=${config.name}`;
    component.resize(1200, 400);
    component.fills = [];

    const isStacked = config.name === 'Stacked';
    applyAutoLayout(component, {
      direction: isStacked ? 'VERTICAL' : 'HORIZONTAL',
      spacing: 24,
    });
    component.primaryAxisSizingMode = 'AUTO';

    // Left column
    const leftCol = figma.createFrame();
    leftCol.name = 'LeftColumn';
    leftCol.fills = [];
    leftCol.resize(isStacked ? 1200 : Math.floor(1200 * config.leftRatio - 12), 300);
    applyAutoLayout(leftCol, { direction: 'VERTICAL', spacing: 24 });
    leftCol.primaryAxisSizingMode = 'AUTO';
    component.appendChild(leftCol);

    // Right column
    const rightCol = figma.createFrame();
    rightCol.name = 'RightColumn';
    rightCol.fills = [];
    rightCol.resize(isStacked ? 1200 : Math.floor(1200 * config.rightRatio - 12), 300);
    applyAutoLayout(rightCol, { direction: 'VERTICAL', spacing: 24 });
    rightCol.primaryAxisSizingMode = 'AUTO';
    component.appendChild(rightCol);

    variants.push(component);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Layout/TwoColumn';
  componentSet.description = 'Two-column split layout (60/40). Use for content + sidebar patterns.';

  return componentSet;
}

async function createLayoutSidebar(): Promise<ComponentNode | ComponentSetNode> {
  const existing = findComponent('Layout/Sidebar');
  if (existing) return existing;

  const colors = getThemeColors().DarkNeon;
  const component = figma.createComponent();
  component.name = 'Layout/Sidebar';
  component.resize(1440, 800);
  component.fills = [];

  applyAutoLayout(component, { direction: 'HORIZONTAL', spacing: 24 });

  // Sidebar
  const sidebar = figma.createFrame();
  sidebar.name = 'Sidebar';
  sidebar.resize(280, 800);
  sidebar.fills = [createSolidPaint(colors.panel)];
  applyAutoLayout(sidebar, { direction: 'VERTICAL', padding: 16, spacing: 8 });

  // Logo placeholder
  const logo = figma.createFrame();
  logo.name = 'Logo';
  logo.resize(248, 40);
  logo.fills = [createSolidPaint(colors.surface)];
  logo.cornerRadius = 8;
  sidebar.appendChild(logo);

  // Nav items
  for (let i = 1; i <= 5; i++) {
    const navItem = figma.createFrame();
    navItem.name = `NavItem${i}`;
    navItem.resize(248, 40);
    navItem.fills = i === 1 ? [createSolidPaint(colors.surface)] : [];
    navItem.cornerRadius = 8;
    applyAutoLayout(navItem, {
      direction: 'HORIZONTAL',
      padding: 8,
      paddingLeft: 12,
      spacing: 8,
      crossAlignment: 'CENTER',
    });

    const navText = await createTextNode(
      `Nav Item ${i}`,
      'body',
      14,
      i === 1 ? colors.text : colors.textMuted,
    );
    navItem.appendChild(navText);
    sidebar.appendChild(navItem);
  }

  // User profile mini-card
  const userCard = figma.createFrame();
  userCard.name = 'UserProfile';
  userCard.resize(248, 56);
  userCard.fills = [createSolidPaint(colors.surface)];
  userCard.cornerRadius = 8;
  applyAutoLayout(userCard, {
    direction: 'HORIZONTAL',
    padding: 8,
    spacing: 8,
    crossAlignment: 'CENTER',
  });
  sidebar.appendChild(userCard);

  component.appendChild(sidebar);

  // Main content
  const main = figma.createFrame();
  main.name = 'MainContent';
  main.resize(1136, 800);
  main.fills = [];
  applyAutoLayout(main, { direction: 'VERTICAL', spacing: 24 });

  // Header bar
  const header = figma.createFrame();
  header.name = 'HeaderBar';
  header.resize(1136, 64);
  header.fills = [createSolidPaint(colors.bgElevated)];
  applyAutoLayout(header, {
    direction: 'HORIZONTAL',
    padding: 16,
    alignment: 'SPACE_BETWEEN',
    crossAlignment: 'CENTER',
  });
  main.appendChild(header);

  // Content area
  const content = figma.createFrame();
  content.name = 'ContentArea';
  content.resize(1136, 700);
  content.fills = [];
  applyAutoLayout(content, { direction: 'VERTICAL', spacing: 24, padding: 24 });
  content.primaryAxisSizingMode = 'AUTO';
  main.appendChild(content);

  component.appendChild(main);
  component.description = 'Fixed sidebar + fluid main content. Use for dashboard/app layouts.';

  return component;
}

function createLayoutStack(): ComponentNode | ComponentSetNode {
  const existing = findComponentSet('Layout/Stack');
  if (existing) return existing;

  const gapValues = [8, 16, 24, 48];
  const variants: ComponentNode[] = [];

  for (const gap of gapValues) {
    const component = figma.createComponent();
    component.name = `Gap=${gap}`;
    component.resize(360, 200);
    component.fills = [];

    applyAutoLayout(component, { direction: 'VERTICAL', spacing: gap });
    component.primaryAxisSizingMode = 'AUTO';
    component.counterAxisSizingMode = 'AUTO';

    variants.push(component);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Layout/Stack';
  componentSet.description = 'Vertical list with configurable gap. Use for form fields, card lists, nav items.';

  return componentSet;
}

function createGridResponsive12(): ComponentNode | ComponentSetNode {
  const existing = findComponentSet('Grid/Responsive12');
  if (existing) return existing;

  const breakpoints: Array<{
    name: string;
    cols: number;
    gutter: number;
    margin: number;
    width: number;
  }> = [
    { name: 'Desktop', cols: 12, gutter: 24, margin: 16, width: 1440 },
    { name: 'Tablet', cols: 6, gutter: 16, margin: 16, width: 768 },
    { name: 'Mobile', cols: 4, gutter: 12, margin: 16, width: 375 },
    { name: 'Compact', cols: 2, gutter: 8, margin: 8, width: 320 },
  ];

  const variants: ComponentNode[] = [];

  for (const bp of breakpoints) {
    const component = figma.createComponent();
    component.name = `Breakpoint=${bp.name}`;
    component.resize(bp.width, 200);
    component.fills = [];

    applyAutoLayout(component, {
      direction: 'HORIZONTAL',
      spacing: bp.gutter,
      paddingLeft: bp.margin,
      paddingRight: bp.margin,
    });
    component.primaryAxisSizingMode = 'FIXED';
    component.counterAxisSizingMode = 'AUTO';
    component.layoutWrap = 'WRAP';

    // Create column placeholders
    const colWidth = Math.floor(
      (bp.width - bp.margin * 2 - bp.gutter * (bp.cols - 1)) / bp.cols,
    );
    for (let i = 0; i < bp.cols; i++) {
      const col = figma.createFrame();
      col.name = `Col${i + 1}`;
      col.resize(colWidth, 80);
      col.fills = [createSolidPaint('#334155', 0.3)];
      col.cornerRadius = 4;
      component.appendChild(col);
    }

    variants.push(component);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Grid/Responsive12';
  componentSet.description = '12-column responsive grid with gutter and margin. Use for card grids and multi-column layouts.';

  return componentSet;
}

// ---------------------------------------------------------------------------
// Card factories
// ---------------------------------------------------------------------------

async function createCardGeneric(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Generic');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 240);

    applyAutoLayout(card, { direction: 'VERTICAL', padding: 16, spacing: 12 });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Title
    const title = await createTextNode('Card Title', 'displaySemiBold', 24, colors.text);
    title.name = 'Title';
    card.appendChild(title);

    // Subtitle
    const subtitle = await createTextNode('Subtitle text here', 'bodySmall', 14, colors.textMuted);
    subtitle.name = 'Subtitle';
    card.appendChild(subtitle);

    // Body
    const body = await createTextNode(
      'Body text content goes here. This is a generic card component with customizable content.',
      'body',
      16,
      colors.textMuted,
    );
    body.name = 'Body';
    card.appendChild(body);

    // CTA button
    const btn = await createButton('Learn More', colors.accent, colors.textInverse);
    btn.name = 'CTA';
    card.appendChild(btn);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Generic';
  componentSet.description = 'Basic text card with title, subtitle, body, and CTA. Use for general content blocks.';

  return componentSet;
}

async function createCardGame(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Game');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 400);

    applyAutoLayout(card, { direction: 'VERTICAL', spacing: 0 });
    card.primaryAxisSizingMode = 'AUTO';
    card.clipsContent = true;
    applyVariantStyle(card, variant, themeName);

    // Image hero (16:9)
    const image = createImagePlaceholder(360, 202, colors.surface);
    image.name = 'HeroImage';
    card.appendChild(image);

    // Content wrapper
    const content = figma.createFrame();
    content.name = 'Content';
    content.fills = [];
    content.resize(360, 160);
    applyAutoLayout(content, { direction: 'VERTICAL', padding: 16, spacing: 12 });
    content.primaryAxisSizingMode = 'AUTO';

    // Title
    const title = await createTextNode('Apex Legends', 'displaySemiBold', 24, colors.text);
    title.name = 'Title';
    content.appendChild(title);

    // Chips row
    const chipsRow = figma.createFrame();
    chipsRow.name = 'PlatformChips';
    chipsRow.fills = [];
    applyAutoLayout(chipsRow, { direction: 'HORIZONTAL', spacing: 8 });
    chipsRow.primaryAxisSizingMode = 'AUTO';
    chipsRow.counterAxisSizingMode = 'AUTO';

    const platforms = ['PS5', 'PC', 'Xbox'];
    for (const platform of platforms) {
      const chip = await createChip(platform, colors.surface, colors.text);
      chipsRow.appendChild(chip);
    }

    // Rating badge
    const rating = await createChip('4.8', colors.accent, colors.accent);
    rating.name = 'RatingBadge';
    chipsRow.appendChild(rating);

    content.appendChild(chipsRow);
    card.appendChild(content);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Game';
  componentSet.description = 'Game showcase card with 16:9 image hero, platform chips, and rating. Use for game listings.';

  return componentSet;
}

async function createCardGuide(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Guide');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 280);

    applyAutoLayout(card, { direction: 'VERTICAL', padding: 16, spacing: 12 });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Badge
    const badge = await createChip('Beginner', colors.accent, colors.accent);
    badge.name = 'DifficultyBadge';
    card.appendChild(badge);

    // Title
    const title = await createTextNode(
      'Getting Started with Competitive Play',
      'displaySemiBold',
      24,
      colors.text,
    );
    title.name = 'Title';
    card.appendChild(title);

    // Metadata row
    const metaRow = figma.createFrame();
    metaRow.name = 'Metadata';
    metaRow.fills = [];
    applyAutoLayout(metaRow, { direction: 'HORIZONTAL', spacing: 16 });
    metaRow.primaryAxisSizingMode = 'AUTO';
    metaRow.counterAxisSizingMode = 'AUTO';

    const timeLabel = await createTextNode('15 min', 'bodySmall', 14, colors.textMuted);
    timeLabel.name = 'TimeEstimate';
    metaRow.appendChild(timeLabel);

    const stepsLabel = await createTextNode('12 steps', 'bodySmall', 14, colors.textMuted);
    stepsLabel.name = 'StepCount';
    metaRow.appendChild(stepsLabel);

    card.appendChild(metaRow);

    // Description
    const body = await createTextNode(
      'Learn the fundamentals of competitive gameplay mechanics.',
      'body',
      16,
      colors.textMuted,
    );
    body.name = 'Description';
    card.appendChild(body);

    // CTA
    const btn = await createButton('Start Guide', colors.accent, colors.textInverse);
    btn.name = 'CTA';
    card.appendChild(btn);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Guide';
  componentSet.description = 'Tutorial/guide card with difficulty badge, time estimate, and step count. Use for educational content.';

  return componentSet;
}

async function createCardFeatured(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Featured');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(600, 400);

    applyAutoLayout(card, { direction: 'VERTICAL', spacing: 0 });
    card.clipsContent = true;
    applyVariantStyle(card, variant, themeName);

    // Image hero (top 60%)
    const image = createImagePlaceholder(600, 240, colors.surface);
    image.name = 'HeroImage';
    card.appendChild(image);

    // Content overlay
    const overlay = figma.createFrame();
    overlay.name = 'ContentOverlay';
    overlay.resize(600, 160);
    overlay.fills = [createSolidPaint(colors.bg, 0.85)];
    applyAutoLayout(overlay, { direction: 'VERTICAL', padding: 24, spacing: 12 });
    overlay.primaryAxisSizingMode = 'AUTO';

    // Title
    const title = await createTextNode('Featured Game Title', 'display', 32, colors.text);
    title.name = 'Title';
    overlay.appendChild(title);

    // Description
    const desc = await createTextNode(
      'Experience the next generation of competitive gaming with stunning visuals.',
      'body',
      16,
      colors.textMuted,
    );
    desc.name = 'Description';
    overlay.appendChild(desc);

    // CTA row
    const ctaRow = figma.createFrame();
    ctaRow.name = 'CTARow';
    ctaRow.fills = [];
    applyAutoLayout(ctaRow, { direction: 'HORIZONTAL', spacing: 16 });
    ctaRow.primaryAxisSizingMode = 'AUTO';
    ctaRow.counterAxisSizingMode = 'AUTO';

    const primaryCta = await createButton('Play Now', colors.accent, colors.textInverse);
    primaryCta.name = 'PrimaryCTA';
    ctaRow.appendChild(primaryCta);

    const secondaryLink = await createTextNode('Learn More →', 'body', 16, colors.accent);
    secondaryLink.name = 'SecondaryLink';
    ctaRow.appendChild(secondaryLink);

    overlay.appendChild(ctaRow);
    card.appendChild(overlay);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Featured';
  componentSet.description = 'Large hero card with gradient overlay and dual CTAs. Use for featured/promoted content.';

  return componentSet;
}

async function createCardStats(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Stats');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  const dataRows = [
    { label: 'K/D Ratio', value: '2.45', trend: '\u25B2', trendUp: true },
    { label: 'Win Rate', value: '68.2%', trend: '\u25B2', trendUp: true },
    { label: 'Avg. FPS', value: '144', trend: '\u25BC', trendUp: false },
  ];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 320);

    applyAutoLayout(card, { direction: 'VERTICAL', padding: 16, spacing: 12 });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Header
    const headerRow = figma.createFrame();
    headerRow.name = 'Header';
    headerRow.fills = [];
    applyAutoLayout(headerRow, { direction: 'HORIZONTAL', spacing: 8, crossAlignment: 'CENTER' });
    headerRow.primaryAxisSizingMode = 'AUTO';
    headerRow.counterAxisSizingMode = 'AUTO';

    const headerTitle = await createTextNode('Performance', 'displaySemiBold', 24, colors.text);
    headerTitle.name = 'Title';
    headerRow.appendChild(headerTitle);
    card.appendChild(headerRow);

    // Data rows
    for (const row of dataRows) {
      const dataRow = figma.createFrame();
      dataRow.name = `DataRow/${row.label}`;
      dataRow.fills = [];
      dataRow.resize(328, 32);
      applyAutoLayout(dataRow, {
        direction: 'HORIZONTAL',
        spacing: 8,
        alignment: 'SPACE_BETWEEN',
        crossAlignment: 'CENTER',
      });

      const label = await createTextNode(row.label, 'bodySmall', 14, colors.textMuted);
      label.name = 'Label';
      label.layoutGrow = 1;
      dataRow.appendChild(label);

      const valueColor = variant === 'Cyberpunk' ? colors.accent2 : colors.text;
      const value = await createTextNode(row.value, 'mono', 14, valueColor);
      value.name = 'Value';
      dataRow.appendChild(value);

      const trendColor = row.trendUp ? colors.success : colors.danger;
      const trend = await createTextNode(row.trend, 'bodySmall', 14, trendColor);
      trend.name = 'Trend';
      dataRow.appendChild(trend);

      card.appendChild(dataRow);

      // Divider
      if (row !== dataRows[dataRows.length - 1]) {
        const divider = figma.createRectangle();
        divider.name = 'Divider';
        divider.resize(328, 1);
        divider.fills = [createSolidPaint(colors.border, variant === 'Neon' ? 0.2 : 1)];
        if (variant === 'Cyberpunk') {
          divider.dashPattern = [4, 2];
        }
        card.appendChild(divider);
      }
    }

    // Sparkline placeholder
    const sparkline = figma.createRectangle();
    sparkline.name = 'Sparkline';
    sparkline.resize(120, 40);
    sparkline.cornerRadius = 4;
    sparkline.fills = [createSolidPaint(colors.accent, 0.2)];
    card.appendChild(sparkline);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Stats';
  componentSet.description = 'Dashboard data card with labeled values, trend indicators, and sparkline. Use for KPI displays.';

  return componentSet;
}

async function createCardFAQ(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/FAQ');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 200);

    applyAutoLayout(card, { direction: 'VERTICAL', padding: 16, spacing: 8 });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Question header
    const questionRow = figma.createFrame();
    questionRow.name = 'QuestionRow';
    questionRow.fills = [];
    applyAutoLayout(questionRow, {
      direction: 'HORIZONTAL',
      spacing: 8,
      alignment: 'SPACE_BETWEEN',
      crossAlignment: 'CENTER',
    });
    questionRow.primaryAxisSizingMode = 'AUTO';
    questionRow.counterAxisSizingMode = 'AUTO';

    const question = await createTextNode(
      'How do I reset my password?',
      'displaySemiBold',
      18,
      colors.text,
    );
    question.name = 'Question';
    question.layoutGrow = 1;
    questionRow.appendChild(question);

    const chevronColor = variant === 'Neon' ? colors.accent : variant === 'Cyberpunk' ? colors.accent2 : colors.textMuted;
    const chevron = await createTextNode('\u25BC', 'body', 14, chevronColor);
    chevron.name = 'Chevron';
    questionRow.appendChild(chevron);

    card.appendChild(questionRow);

    // Category chip
    const chipBg = variant === 'Neon' ? colors.accent : variant === 'Cyberpunk' ? colors.danger : colors.surface;
    const chipText = variant === 'Neon' ? colors.accent : variant === 'Cyberpunk' ? colors.danger : colors.textMuted;
    const categoryChip = await createChip('Account', chipBg, chipText);
    categoryChip.name = 'CategoryChip';
    card.appendChild(categoryChip);

    // Answer frame (collapsed by default)
    const answerFrame = figma.createFrame();
    answerFrame.name = 'AnswerFrame';
    answerFrame.fills = variant === 'Glass' ? [createSolidPaint(colors.bgElevated, 0.5)] : [createSolidPaint(colors.bgElevated)];
    answerFrame.cornerRadius = 8;
    answerFrame.resize(328, 0);
    answerFrame.clipsContent = true;
    applyAutoLayout(answerFrame, { direction: 'VERTICAL', padding: 12, spacing: 8 });

    const answer = await createTextNode(
      'Click "Forgot Password" on the login page and follow the email instructions to create a new password.',
      'body',
      16,
      colors.textMuted,
    );
    answer.name = 'Answer';
    answerFrame.appendChild(answer);
    card.appendChild(answerFrame);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/FAQ';
  componentSet.description = 'Accordion-style Q&A card with expandable answer. Use for help/support sections.';

  return componentSet;
}

async function createCardProfile(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Profile');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(320, 400);

    applyAutoLayout(card, {
      direction: 'VERTICAL',
      padding: 20,
      spacing: 12,
      alignment: 'CENTER',
      crossAlignment: 'CENTER',
    });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Avatar
    const avatar = figma.createEllipse();
    avatar.name = 'Avatar';
    avatar.resize(80, 80);
    avatar.fills = [createSolidPaint(colors.surface)];
    card.appendChild(avatar);

    // Name
    const name = await createTextNode('Alex Johnson', 'displaySemiBold', 24, colors.text);
    name.name = 'Name';
    name.textAlignHorizontal = 'CENTER';
    card.appendChild(name);

    // Role
    const role = await createTextNode('Senior Game Developer', 'bodySmall', 14, colors.textMuted);
    role.name = 'Role';
    role.textAlignHorizontal = 'CENTER';
    card.appendChild(role);

    // Bio
    const bio = await createTextNode(
      'Building immersive gaming experiences with a passion for competitive esports.',
      'body',
      16,
      colors.textMuted,
    );
    bio.name = 'Bio';
    bio.textAlignHorizontal = 'CENTER';
    card.appendChild(bio);

    // Social chips row
    const socialRow = figma.createFrame();
    socialRow.name = 'SocialLinks';
    socialRow.fills = [];
    applyAutoLayout(socialRow, { direction: 'HORIZONTAL', spacing: 8 });
    socialRow.primaryAxisSizingMode = 'AUTO';
    socialRow.counterAxisSizingMode = 'AUTO';

    const socials = ['Twitter', 'GitHub', 'LinkedIn'];
    for (const social of socials) {
      const chip = await createChip(social, colors.accent, colors.accent);
      socialRow.appendChild(chip);
    }
    card.appendChild(socialRow);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Profile';
  componentSet.description = 'User profile card with avatar, name, role, bio, and social links. Use for team/user displays.';

  return componentSet;
}

async function createCardPricing(): Promise<ComponentSetNode> {
  const existing = findComponentSet('Card/Pricing');
  if (existing) return existing;

  const variants: ComponentNode[] = [];
  const variantNames: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass'];
  const themeName: ThemeName = 'DarkNeon';
  const colors = getThemeColors()[themeName];

  const features = [
    { name: 'Unlimited game tracking', included: true },
    { name: 'Advanced analytics', included: true },
    { name: 'Custom team profiles', included: true },
    { name: 'Priority support', included: true },
    { name: 'API access', included: true },
    { name: 'White-label solution', included: false },
  ];

  for (const variant of variantNames) {
    const card = figma.createComponent();
    card.name = `Theme=${variant}`;
    card.resize(360, 520);

    applyAutoLayout(card, {
      direction: 'VERTICAL',
      padding: 24,
      spacing: 16,
      alignment: 'CENTER',
      crossAlignment: 'CENTER',
    });
    card.primaryAxisSizingMode = 'AUTO';
    applyVariantStyle(card, variant, themeName);

    // Popular badge
    const badge = await createChip('Popular', colors.accent, colors.textInverse);
    badge.name = 'PopularBadge';
    badge.fills = [createSolidPaint(colors.accent)];
    card.appendChild(badge);

    // Tier name
    const tierName = await createTextNode('Pro Plan', 'displaySemiBold', 24, colors.text);
    tierName.name = 'TierName';
    tierName.textAlignHorizontal = 'CENTER';
    card.appendChild(tierName);

    // Price row
    const priceRow = figma.createFrame();
    priceRow.name = 'PriceRow';
    priceRow.fills = [];
    applyAutoLayout(priceRow, {
      direction: 'HORIZONTAL',
      spacing: 8,
      crossAlignment: 'CENTER',
    });
    priceRow.primaryAxisSizingMode = 'AUTO';
    priceRow.counterAxisSizingMode = 'AUTO';

    const oldPrice = await createTextNode('$49', 'body', 16, colors.textMuted);
    oldPrice.name = 'OriginalPrice';
    oldPrice.textDecoration = 'STRIKETHROUGH';
    priceRow.appendChild(oldPrice);

    const newPrice = await createTextNode('$29/mo', 'display', 32, colors.accent);
    newPrice.name = 'CurrentPrice';
    priceRow.appendChild(newPrice);

    card.appendChild(priceRow);

    // Divider
    const divider1 = figma.createRectangle();
    divider1.name = 'Divider';
    divider1.resize(312, 1);
    divider1.fills = [createSolidPaint(colors.border)];
    card.appendChild(divider1);

    // Feature list
    const featureList = figma.createFrame();
    featureList.name = 'FeatureList';
    featureList.fills = [];
    applyAutoLayout(featureList, { direction: 'VERTICAL', spacing: 8 });
    featureList.primaryAxisSizingMode = 'AUTO';
    featureList.counterAxisSizingMode = 'AUTO';

    for (const feature of features) {
      const featureRow = figma.createFrame();
      featureRow.name = `Feature/${feature.name}`;
      featureRow.fills = [];
      applyAutoLayout(featureRow, {
        direction: 'HORIZONTAL',
        spacing: 8,
        crossAlignment: 'CENTER',
      });
      featureRow.primaryAxisSizingMode = 'AUTO';
      featureRow.counterAxisSizingMode = 'AUTO';

      const icon = await createTextNode(
        feature.included ? '\u2713' : '\u2717',
        'body',
        14,
        feature.included ? colors.success : colors.textMuted,
      );
      icon.name = 'Icon';
      featureRow.appendChild(icon);

      const featureName = await createTextNode(
        feature.name,
        'body',
        14,
        feature.included ? colors.text : colors.textMuted,
      );
      featureName.name = 'FeatureName';
      if (!feature.included) {
        featureName.textDecoration = 'STRIKETHROUGH';
      }
      featureRow.appendChild(featureName);

      featureList.appendChild(featureRow);
    }
    card.appendChild(featureList);

    // Divider
    const divider2 = figma.createRectangle();
    divider2.name = 'Divider2';
    divider2.resize(312, 1);
    divider2.fills = [createSolidPaint(colors.border)];
    card.appendChild(divider2);

    // CTA
    const btn = await createButton('Get Started', colors.accent, colors.textInverse);
    btn.name = 'CTA';
    card.appendChild(btn);

    variants.push(card);
  }

  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = 'Card/Pricing';
  componentSet.description = 'Pricing tier card with price, feature list, and CTA. Use for plan comparison.';

  return componentSet;
}

// ---------------------------------------------------------------------------
// Main export: create all containers and cards
// ---------------------------------------------------------------------------

export async function createContainersAndCards(): Promise<ComponentSystemResult> {
  const containers = new Map<string, ComponentSetNode | ComponentNode>();
  const cards = new Map<string, ComponentSetNode>();

  // Containers
  sendProgress('components', 0, 14, 'Creating Container/Centered...');
  containers.set('Container/Centered', createContainerCentered());

  sendProgress('components', 1, 14, 'Creating Section/FullBleed...');
  containers.set('Section/FullBleed', createSectionFullBleed());

  sendProgress('components', 2, 14, 'Creating Layout/TwoColumn...');
  containers.set('Layout/TwoColumn', createLayoutTwoColumn());

  sendProgress('components', 3, 14, 'Creating Layout/Sidebar...');
  containers.set('Layout/Sidebar', await createLayoutSidebar());

  sendProgress('components', 4, 14, 'Creating Layout/Stack...');
  containers.set('Layout/Stack', createLayoutStack());

  sendProgress('components', 5, 14, 'Creating Grid/Responsive12...');
  containers.set('Grid/Responsive12', createGridResponsive12());

  // Cards
  sendProgress('components', 6, 14, 'Creating Card/Generic...');
  cards.set('Card/Generic', await createCardGeneric());

  sendProgress('components', 7, 14, 'Creating Card/Game...');
  cards.set('Card/Game', await createCardGame());

  sendProgress('components', 8, 14, 'Creating Card/Guide...');
  cards.set('Card/Guide', await createCardGuide());

  sendProgress('components', 9, 14, 'Creating Card/Featured...');
  cards.set('Card/Featured', await createCardFeatured());

  sendProgress('components', 10, 14, 'Creating Card/Stats...');
  cards.set('Card/Stats', await createCardStats());

  sendProgress('components', 11, 14, 'Creating Card/FAQ...');
  cards.set('Card/FAQ', await createCardFAQ());

  sendProgress('components', 12, 14, 'Creating Card/Profile...');
  cards.set('Card/Profile', await createCardProfile());

  sendProgress('components', 13, 14, 'Creating Card/Pricing...');
  cards.set('Card/Pricing', await createCardPricing());

  const containerNames = Array.from(containers.keys()).join(', ');
  const cardNames = Array.from(cards.keys()).join(', ');
  figma.notify(
    `Components created: ${containers.size} containers (${containerNames}), ${cards.size} cards (${cardNames})`,
    { timeout: 3000 },
  );

  return { containers, cards };
}
