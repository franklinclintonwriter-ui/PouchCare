/**
 * Template generators and page assemblers.
 * Creates production-ready page layouts using component instances.
 */

import { createSolidPaint } from './utils/colors';
import { loadFontWithFallback, getFontName } from './utils/fonts';
import { findOrCreatePage, findComponentSet } from './utils/guards';
import { applyAutoLayout, sendProgress } from './utils/figma-api';
import { getThemeColors } from './tokens';

// ---------------------------------------------------------------------------
// Helper: create section title
// ---------------------------------------------------------------------------

async function createSectionTitle(
  text: string,
  colorHex: string,
): Promise<TextNode> {
  const textNode = figma.createText();
  const font = await loadFontWithFallback('display');
  textNode.fontName = getFontName(font);
  textNode.fontSize = 32;
  textNode.fills = [createSolidPaint(colorHex)];
  textNode.characters = text;
  textNode.name = 'SectionTitle';
  return textNode;
}

async function createBodyText(
  text: string,
  colorHex: string,
  size: number = 16,
): Promise<TextNode> {
  const textNode = figma.createText();
  const font = await loadFontWithFallback('body');
  textNode.fontName = getFontName(font);
  textNode.fontSize = size;
  textNode.fills = [createSolidPaint(colorHex)];
  textNode.characters = text;
  return textNode;
}

// ---------------------------------------------------------------------------
// Helper: create a placeholder frame
// ---------------------------------------------------------------------------

function createPlaceholder(
  name: string,
  width: number,
  height: number,
  fillHex: string,
  radius: number = 8,
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.fills = [createSolidPaint(fillHex)];
  frame.cornerRadius = radius;
  return frame;
}

// ---------------------------------------------------------------------------
// Helper: get component instance or fallback frame
// ---------------------------------------------------------------------------

function getCardInstance(
  cardType: string,
  variant: string,
): InstanceNode | FrameNode {
  const componentSet = findComponentSet(cardType);
  if (componentSet) {
    const targetVariant = componentSet.children.find(
      (child) => child.type === 'COMPONENT' && child.name.includes(`Theme=${variant}`),
    ) as ComponentNode | undefined;

    if (targetVariant) {
      return targetVariant.createInstance();
    }

    const defaultComponent = componentSet.defaultVariant;
    if (defaultComponent) {
      return defaultComponent.createInstance();
    }
  }

  // Fallback: create placeholder frame
  const fallback = figma.createFrame();
  fallback.name = `${cardType} (placeholder)`;
  fallback.resize(360, 240);
  fallback.fills = [createSolidPaint('#1e293b')];
  fallback.cornerRadius = 8;
  return fallback;
}

// ---------------------------------------------------------------------------
// Template: Guide Hub
// ---------------------------------------------------------------------------

async function createGuideHubTemplate(
  page: PageNode,
  yOffset: number,
): Promise<{ frame: FrameNode; instanceCount: number }> {
  const colors = getThemeColors().DarkNeon;
  let instanceCount = 0;

  const container = figma.createFrame();
  container.name = 'Template/GuideHub';
  container.resize(1440, 1200);
  container.fills = [createSolidPaint(colors.bg)];
  applyAutoLayout(container, {
    direction: 'VERTICAL',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 32,
    paddingRight: 32,
    spacing: 48,
    alignment: 'CENTER',
  });
  container.x = 0;
  container.y = yOffset;

  // Header
  const header = figma.createFrame();
  header.name = 'Header';
  header.fills = [];
  applyAutoLayout(header, { direction: 'VERTICAL', spacing: 16, alignment: 'CENTER', crossAlignment: 'CENTER' });
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';

  const title = await createSectionTitle('Guides & Tutorials', colors.text);
  header.appendChild(title);

  // Search placeholder
  const searchBar = createPlaceholder('SearchBar', 600, 48, colors.surface);
  searchBar.cornerRadius = 24;
  header.appendChild(searchBar);

  // Filter chips
  const filterRow = figma.createFrame();
  filterRow.name = 'FilterChips';
  filterRow.fills = [];
  applyAutoLayout(filterRow, { direction: 'HORIZONTAL', spacing: 8 });
  filterRow.primaryAxisSizingMode = 'AUTO';
  filterRow.counterAxisSizingMode = 'AUTO';

  const filters = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  for (const filter of filters) {
    const chip = createPlaceholder(`Chip/${filter}`, 100, 36, filter === 'All' ? colors.accent : colors.surface);
    chip.cornerRadius = 18;
    filterRow.appendChild(chip);
  }
  header.appendChild(filterRow);
  container.appendChild(header);

  // Content area (two column)
  const contentArea = figma.createFrame();
  contentArea.name = 'ContentArea';
  contentArea.fills = [];
  applyAutoLayout(contentArea, { direction: 'HORIZONTAL', spacing: 24 });
  contentArea.primaryAxisSizingMode = 'AUTO';
  contentArea.counterAxisSizingMode = 'AUTO';

  // Main: 3x2 grid of Guide cards
  const mainGrid = figma.createFrame();
  mainGrid.name = 'GuideGrid';
  mainGrid.fills = [];
  mainGrid.resize(900, 600);
  applyAutoLayout(mainGrid, { direction: 'HORIZONTAL', spacing: 16 });
  mainGrid.layoutWrap = 'WRAP';
  mainGrid.counterAxisSpacing = 16;

  const guideVariants: CardVariant[] = ['Minimal', 'Neon', 'Glass', 'Cyberpunk', 'Minimal', 'Neon'];
  for (const variant of guideVariants) {
    const instance = getCardInstance('Card/Guide', variant);
    mainGrid.appendChild(instance);
    instanceCount++;
  }
  contentArea.appendChild(mainGrid);

  // Sidebar
  const sidebar = figma.createFrame();
  sidebar.name = 'Sidebar';
  sidebar.fills = [];
  sidebar.resize(300, 600);
  applyAutoLayout(sidebar, { direction: 'VERTICAL', spacing: 24 });
  sidebar.primaryAxisSizingMode = 'AUTO';

  const categoryTitle = await createBodyText('Categories', colors.text, 18);
  sidebar.appendChild(categoryTitle);

  const categories = ['Movement', 'Weapons', 'Strategy', 'Settings', 'Ranked'];
  for (const cat of categories) {
    const catItem = await createBodyText(cat, colors.textMuted, 14);
    sidebar.appendChild(catItem);
  }

  // Popular stats card
  const statsInstance = getCardInstance('Card/Stats', 'Minimal');
  sidebar.appendChild(statsInstance);
  instanceCount++;

  contentArea.appendChild(sidebar);
  container.appendChild(contentArea);

  // Footer
  const footer = await createBodyText('PouchCare Design System v1.0.0', colors.textMuted, 12);
  footer.name = 'Footer';
  container.appendChild(footer);

  page.appendChild(container);
  return { frame: container, instanceCount };
}

// ---------------------------------------------------------------------------
// Template: Game Showcase
// ---------------------------------------------------------------------------

async function createGameShowcaseTemplate(
  page: PageNode,
  yOffset: number,
): Promise<{ frame: FrameNode; instanceCount: number }> {
  const colors = getThemeColors().DarkNeon;
  let instanceCount = 0;

  const container = figma.createFrame();
  container.name = 'Template/GameShowcase';
  container.resize(1440, 1800);
  container.fills = [createSolidPaint(colors.bg)];
  applyAutoLayout(container, {
    direction: 'VERTICAL',
    spacing: 48,
  });
  container.x = 1500;
  container.y = yOffset;

  // Hero section (FullBleed)
  const hero = figma.createFrame();
  hero.name = 'HeroSection';
  hero.resize(1440, 400);
  hero.fills = [createSolidPaint(colors.bgElevated)];
  applyAutoLayout(hero, {
    direction: 'VERTICAL',
    paddingTop: 64,
    paddingBottom: 64,
    paddingLeft: 32,
    paddingRight: 32,
    spacing: 16,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });

  const heroTitle = await createSectionTitle('Featured Games', colors.text);
  hero.appendChild(heroTitle);
  const heroSubtitle = await createBodyText(
    'Discover the most popular competitive titles',
    colors.textMuted,
  );
  heroSubtitle.textAlignHorizontal = 'CENTER';
  hero.appendChild(heroSubtitle);
  container.appendChild(hero);

  // Featured row
  const featuredRow = figma.createFrame();
  featuredRow.name = 'FeaturedRow';
  featuredRow.fills = [];
  applyAutoLayout(featuredRow, {
    direction: 'HORIZONTAL',
    spacing: 24,
    paddingLeft: 32,
    paddingRight: 32,
  });
  featuredRow.primaryAxisSizingMode = 'AUTO';
  featuredRow.counterAxisSizingMode = 'AUTO';

  const featuredCard = getCardInstance('Card/Featured', 'Neon');
  featuredRow.appendChild(featuredCard);
  instanceCount++;

  const gameCard1 = getCardInstance('Card/Game', 'Cyberpunk');
  featuredRow.appendChild(gameCard1);
  instanceCount++;

  const gameCard2 = getCardInstance('Card/Game', 'Cyberpunk');
  featuredRow.appendChild(gameCard2);
  instanceCount++;

  container.appendChild(featuredRow);

  // Stats strip
  const statsStrip = figma.createFrame();
  statsStrip.name = 'StatsStrip';
  statsStrip.fills = [];
  applyAutoLayout(statsStrip, {
    direction: 'HORIZONTAL',
    spacing: 16,
    paddingLeft: 32,
    paddingRight: 32,
  });
  statsStrip.primaryAxisSizingMode = 'AUTO';
  statsStrip.counterAxisSizingMode = 'AUTO';

  for (let i = 0; i < 4; i++) {
    const statsCard = getCardInstance('Card/Stats', 'Neon');
    statsStrip.appendChild(statsCard);
    instanceCount++;
  }
  container.appendChild(statsStrip);

  // Game grid section
  const gridSection = figma.createFrame();
  gridSection.name = 'GameGrid';
  gridSection.fills = [];
  gridSection.resize(1376, 500);
  applyAutoLayout(gridSection, {
    direction: 'HORIZONTAL',
    spacing: 16,
    paddingLeft: 32,
    paddingRight: 32,
  });
  gridSection.layoutWrap = 'WRAP';
  gridSection.counterAxisSpacing = 16;

  const gameVariants: CardVariant[] = ['Minimal', 'Neon', 'Cyberpunk', 'Glass', 'Minimal', 'Neon'];
  for (const variant of gameVariants) {
    const gameCard = getCardInstance('Card/Game', variant);
    gridSection.appendChild(gameCard);
    instanceCount++;
  }
  container.appendChild(gridSection);

  // CTA section
  const ctaSection = figma.createFrame();
  ctaSection.name = 'CTASection';
  ctaSection.resize(1440, 300);
  ctaSection.fills = [createSolidPaint(colors.bgElevated)];
  applyAutoLayout(ctaSection, {
    direction: 'VERTICAL',
    padding: 48,
    spacing: 24,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });

  const ctaCard = getCardInstance('Card/Featured', 'Glass');
  ctaSection.appendChild(ctaCard);
  instanceCount++;
  container.appendChild(ctaSection);

  page.appendChild(container);
  return { frame: container, instanceCount };
}

// ---------------------------------------------------------------------------
// Template: FAQ & Support
// ---------------------------------------------------------------------------

async function createFAQTemplate(
  page: PageNode,
  yOffset: number,
): Promise<{ frame: FrameNode; instanceCount: number }> {
  const colors = getThemeColors().LightMinimal;
  let instanceCount = 0;

  const container = figma.createFrame();
  container.name = 'Template/FAQSupport';
  container.resize(1440, 1200);
  container.fills = [createSolidPaint(colors.bg)];
  applyAutoLayout(container, {
    direction: 'VERTICAL',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 120,
    paddingRight: 120,
    spacing: 48,
    alignment: 'CENTER',
    crossAlignment: 'CENTER',
  });
  container.x = 0;
  container.y = yOffset + 1300;

  // Header
  const title = await createSectionTitle('Help Center', colors.text);
  container.appendChild(title);

  // Search bar
  const searchBar = createPlaceholder('SearchBar', 700, 56, colors.surface);
  searchBar.cornerRadius = 28;
  container.appendChild(searchBar);

  // Category cards row
  const categoriesRow = figma.createFrame();
  categoriesRow.name = 'Categories';
  categoriesRow.fills = [];
  applyAutoLayout(categoriesRow, { direction: 'HORIZONTAL', spacing: 24 });
  categoriesRow.primaryAxisSizingMode = 'AUTO';
  categoriesRow.counterAxisSizingMode = 'AUTO';

  for (let i = 0; i < 3; i++) {
    const catCard = getCardInstance('Card/Generic', 'Minimal');
    categoriesRow.appendChild(catCard);
    instanceCount++;
  }
  container.appendChild(categoriesRow);

  // FAQ section
  const faqSection = figma.createFrame();
  faqSection.name = 'FAQSection';
  faqSection.fills = [];
  applyAutoLayout(faqSection, { direction: 'VERTICAL', spacing: 16 });
  faqSection.primaryAxisSizingMode = 'AUTO';
  faqSection.counterAxisSizingMode = 'AUTO';

  const faqTitle = await createBodyText('Frequently Asked Questions', colors.text, 24);
  faqSection.appendChild(faqTitle);

  for (let i = 0; i < 5; i++) {
    const faqCard = getCardInstance('Card/FAQ', 'Glass');
    faqSection.appendChild(faqCard);
    instanceCount++;
  }
  container.appendChild(faqSection);

  // Contact CTA
  const ctaCard = getCardInstance('Card/Featured', 'Neon');
  container.appendChild(ctaCard);
  instanceCount++;

  page.appendChild(container);
  return { frame: container, instanceCount };
}

// ---------------------------------------------------------------------------
// Template: Dashboard
// ---------------------------------------------------------------------------

async function createDashboardTemplate(
  page: PageNode,
  yOffset: number,
): Promise<{ frame: FrameNode; instanceCount: number }> {
  const colors = getThemeColors().DarkNeon;
  let instanceCount = 0;

  const container = figma.createFrame();
  container.name = 'Template/Dashboard';
  container.resize(1440, 900);
  container.fills = [createSolidPaint(colors.bg)];
  applyAutoLayout(container, { direction: 'HORIZONTAL', spacing: 0 });
  container.x = 1500;
  container.y = yOffset + 1300;

  // Sidebar nav
  const sidebar = figma.createFrame();
  sidebar.name = 'SidebarNav';
  sidebar.resize(280, 900);
  sidebar.fills = [createSolidPaint(colors.panel)];
  applyAutoLayout(sidebar, { direction: 'VERTICAL', padding: 16, spacing: 8 });

  // Logo
  const logo = createPlaceholder('Logo', 248, 40, colors.surface);
  sidebar.appendChild(logo);

  // Nav items
  const navLabels = ['Dashboard', 'Games', 'Analytics', 'Settings', 'Support'];
  for (const label of navLabels) {
    const navItem = createPlaceholder(`Nav/${label}`, 248, 40, label === 'Dashboard' ? colors.surface : 'transparent');
    navItem.cornerRadius = 8;
    sidebar.appendChild(navItem);
  }

  // Spacer
  const spacer = figma.createFrame();
  spacer.name = 'Spacer';
  spacer.resize(248, 200);
  spacer.fills = [];
  spacer.layoutGrow = 1;
  sidebar.appendChild(spacer);

  // User mini card
  const userMini = createPlaceholder('UserMini', 248, 56, colors.surface);
  userMini.cornerRadius = 8;
  sidebar.appendChild(userMini);

  container.appendChild(sidebar);

  // Main content area
  const main = figma.createFrame();
  main.name = 'MainContent';
  main.resize(1160, 900);
  main.fills = [];
  applyAutoLayout(main, { direction: 'VERTICAL', padding: 24, spacing: 24 });

  // Header with notifications
  const headerBar = figma.createFrame();
  headerBar.name = 'Header';
  headerBar.fills = [];
  headerBar.resize(1112, 48);
  applyAutoLayout(headerBar, {
    direction: 'HORIZONTAL',
    alignment: 'SPACE_BETWEEN',
    crossAlignment: 'CENTER',
  });

  const headerTitle = await createBodyText('Dashboard Overview', colors.text, 24);
  headerBar.appendChild(headerTitle);

  const notifIcon = createPlaceholder('NotificationIcon', 32, 32, colors.surface);
  notifIcon.cornerRadius = 16;
  headerBar.appendChild(notifIcon);
  main.appendChild(headerBar);

  // Stats row
  const statsRow = figma.createFrame();
  statsRow.name = 'StatsRow';
  statsRow.fills = [];
  applyAutoLayout(statsRow, { direction: 'HORIZONTAL', spacing: 16 });
  statsRow.primaryAxisSizingMode = 'AUTO';
  statsRow.counterAxisSizingMode = 'AUTO';

  for (let i = 0; i < 4; i++) {
    const statsCard = getCardInstance('Card/Stats', 'Minimal');
    statsRow.appendChild(statsCard);
    instanceCount++;
  }
  main.appendChild(statsRow);

  // Content row (activity feed + aside)
  const contentRow = figma.createFrame();
  contentRow.name = 'ContentRow';
  contentRow.fills = [];
  applyAutoLayout(contentRow, { direction: 'HORIZONTAL', spacing: 24 });
  contentRow.primaryAxisSizingMode = 'AUTO';
  contentRow.counterAxisSizingMode = 'AUTO';

  // Activity feed
  const activityFeed = figma.createFrame();
  activityFeed.name = 'ActivityFeed';
  activityFeed.fills = [];
  activityFeed.resize(700, 400);
  applyAutoLayout(activityFeed, { direction: 'VERTICAL', spacing: 12 });
  activityFeed.primaryAxisSizingMode = 'AUTO';

  const activityTitle = await createBodyText('Recent Activity', colors.text, 18);
  activityFeed.appendChild(activityTitle);

  for (let i = 0; i < 3; i++) {
    const activityCard = getCardInstance('Card/Generic', 'Minimal');
    activityFeed.appendChild(activityCard);
    instanceCount++;
  }

  // Quick actions
  const quickActions = figma.createFrame();
  quickActions.name = 'QuickActions';
  quickActions.fills = [];
  applyAutoLayout(quickActions, { direction: 'HORIZONTAL', spacing: 12 });
  quickActions.primaryAxisSizingMode = 'AUTO';
  quickActions.counterAxisSizingMode = 'AUTO';

  for (let i = 0; i < 3; i++) {
    const actionBtn = createPlaceholder(`QuickAction${i + 1}`, 120, 40, colors.accent);
    actionBtn.cornerRadius = 8;
    quickActions.appendChild(actionBtn);
  }
  activityFeed.appendChild(quickActions);
  contentRow.appendChild(activityFeed);

  // Right aside
  const aside = figma.createFrame();
  aside.name = 'RightAside';
  aside.fills = [];
  aside.resize(360, 400);
  applyAutoLayout(aside, { direction: 'VERTICAL', spacing: 16 });
  aside.primaryAxisSizingMode = 'AUTO';

  const profileCard = getCardInstance('Card/Profile', 'Neon');
  aside.appendChild(profileCard);
  instanceCount++;

  const pricingTeaser = getCardInstance('Card/Pricing', 'Glass');
  aside.appendChild(pricingTeaser);
  instanceCount++;

  contentRow.appendChild(aside);
  main.appendChild(contentRow);

  container.appendChild(main);
  page.appendChild(container);
  return { frame: container, instanceCount };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createContentTemplates(): Promise<TemplateResult> {
  const page = findOrCreatePage('Templates');
  let totalInstances = 0;
  const templateNames: string[] = [];

  sendProgress('templates', 0, 4, 'Creating Guide Hub template...');
  const guideHub = await createGuideHubTemplate(page, 0);
  totalInstances += guideHub.instanceCount;
  templateNames.push('Guide Hub');

  sendProgress('templates', 1, 4, 'Creating Game Showcase template...');
  const gameShowcase = await createGameShowcaseTemplate(page, 0);
  totalInstances += gameShowcase.instanceCount;
  templateNames.push('Game Showcase');

  sendProgress('templates', 2, 4, 'Creating FAQ & Support template...');
  const faq = await createFAQTemplate(page, 0);
  totalInstances += faq.instanceCount;
  templateNames.push('FAQ & Support');

  sendProgress('templates', 3, 4, 'Creating Dashboard template...');
  const dashboard = await createDashboardTemplate(page, 0);
  totalInstances += dashboard.instanceCount;
  templateNames.push('Dashboard');

  figma.notify(
    `Templates created: ${templateNames.join(', ')} (${totalInstances} component instances)`,
    { timeout: 3000 },
  );

  return {
    templateNames,
    instanceCount: totalInstances,
    pageId: page.id,
  };
}
