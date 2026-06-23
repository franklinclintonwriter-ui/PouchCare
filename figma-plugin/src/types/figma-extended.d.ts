/**
 * Augmented Figma API types for the Design System Bootstrapper plugin.
 * Provides branded types, strict interfaces, and utility types.
 */

// Branded types for type-safe node IDs
declare type BrandedId<T extends string> = string & { readonly __brand: T };

declare type FigmaNodeId = BrandedId<'FigmaNodeId'>;
declare type VariableId = BrandedId<'VariableId'>;
declare type VariableCollectionId = BrandedId<'VariableCollectionId'>;
declare type ModeId = BrandedId<'ModeId'>;
declare type StyleId = BrandedId<'StyleId'>;

// Plugin command types
declare type PluginCommand = 'tokens' | 'components' | 'templates' | 'previews' | 'export' | 'bootstrap' | 'reset';

// Theme names
declare type ThemeName = 'DarkNeon' | 'LightMinimal' | 'EsportsBlackRed' | 'CyberpunkPurpleCyan';

// Card variant styles
declare type CardVariant = 'Minimal' | 'Neon' | 'Cyberpunk' | 'Glass';

// Container types
declare type ContainerType = 'Centered' | 'FullBleed' | 'TwoColumn' | 'Sidebar' | 'Stack' | 'Responsive12';

// Card types
declare type CardType = 'Generic' | 'Game' | 'Guide' | 'Featured' | 'Stats' | 'FAQ' | 'Profile' | 'Pricing';

// Color token keys
declare type ColorTokenKey =
  | 'bg'
  | 'bgElevated'
  | 'panel'
  | 'surface'
  | 'text'
  | 'textMuted'
  | 'textInverse'
  | 'border'
  | 'borderHover'
  | 'accent'
  | 'accent2'
  | 'success'
  | 'warn'
  | 'danger';

// Numeric token keys
declare type NumericTokenKey =
  | 'radiusSm'
  | 'radiusMd'
  | 'radiusLg'
  | 'spacingUnit'
  | 'shadowBlur'
  | 'glowIntensity';

// String token keys
declare type StringTokenKey = 'fontDisplay' | 'fontMono';

// Theme color map
declare type ThemeColorMap = Record<ColorTokenKey, string>;

// Theme numeric map
declare type ThemeNumericMap = Record<NumericTokenKey, number>;

// Theme string map
declare type ThemeStringMap = Record<StringTokenKey, string>;

// Variable map: variable name → Variable object
declare type VariableMap = Map<string, Variable>;

// Mode map: theme name → mode ID
declare type ModeMap = Map<ThemeName, string>;

// Text style map
declare type TextStyleMap = Map<string, TextStyle>;

// Paint style map
declare type PaintStyleMap = Map<string, PaintStyle>;

// Component registry
declare type ComponentRegistry = Map<string, ComponentSetNode | ComponentNode>;

// Token system result
declare interface TokenSystemResult {
  collection: VariableCollection;
  modes: ModeMap;
  variables: VariableMap;
  textStyles: TextStyleMap;
  paintStyles: PaintStyleMap;
}

// Component system result
declare interface ComponentSystemResult {
  containers: Map<string, ComponentSetNode | ComponentNode>;
  cards: Map<string, ComponentSetNode>;
}

// Template result
declare interface TemplateResult {
  templateNames: string[];
  instanceCount: number;
  pageId: string;
}

// Export manifest
declare interface ExportManifest {
  version: string;
  generatedAt: string;
  summary: {
    components: number;
    variables: number;
    styles: number;
    pages: number;
  };
  themes: Array<{
    name: ThemeName;
    modeId: string;
    colors: Record<ColorTokenKey, string>;
  }>;
  components: Array<{
    name: string;
    type: string;
    nodeId: string;
    variants: string[];
    properties: Record<string, string[]>;
    dependencies: string[];
  }>;
  styles: Array<{
    name: string;
    type: string;
    nodeId: string;
  }>;
}

// Validation report
declare interface ValidationReport {
  isValid: boolean;
  tokensPresent: boolean;
  componentsPresent: boolean;
  templatesPresent: boolean;
  previewsPresent: boolean;
  missingFonts: string[];
  contrastWarnings: Array<{
    foreground: string;
    background: string;
    ratio: number;
    theme: ThemeName;
  }>;
  brokenReferences: string[];
  errors: string[];
}

// Plugin state
declare interface PluginState {
  lastCommand: PluginCommand | null;
  createdNodes: FigmaNodeId[];
  errors: Array<{
    command: PluginCommand;
    message: string;
    timestamp: number;
  }>;
  isProcessing: boolean;
}

// Auto-layout options
declare interface AutoLayoutOptions {
  direction: 'HORIZONTAL' | 'VERTICAL';
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  spacing?: number;
  alignment?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  crossAlignment?: 'MIN' | 'CENTER' | 'MAX';
  sizing?: 'HUG' | 'FILL' | 'FIXED';
}

// Card variant config
declare interface VariantConfig {
  borderWidth: number;
  borderStyle: 'solid' | 'dashed';
  borderColor: ColorTokenKey;
  radius: number;
  fillColor: ColorTokenKey;
  fillOpacity: number;
  shadow: ShadowConfig | null;
  blur: number;
}

// Shadow config
declare interface ShadowConfig {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  opacity: number;
}

// UI message types
declare interface UIMessage {
  type: 'run-command' | 'cancel' | 'copy-manifest';
  command?: PluginCommand;
  data?: string;
}

declare interface PluginMessage {
  type: 'progress' | 'complete' | 'error' | 'manifest-data' | 'state-update';
  command?: PluginCommand;
  message?: string;
  progress?: { current: number; total: number; label: string };
  data?: string;
  state?: Partial<PluginState>;
}

// HTML import declaration
declare module '*.html' {
  const content: string;
  export default content;
}
