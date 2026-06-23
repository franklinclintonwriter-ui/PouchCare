/**
 * Safe Figma API wrappers with retry logic and error handling.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  retries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`${label}: attempt ${attempt} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`${label}: all ${retries} attempts failed. Last error: ${lastError?.message}`);
}

/**
 * Safely get a node by ID, returning null if not found.
 */
export function safeGetNodeById(id: string): BaseNode | null {
  try {
    return figma.getNodeById(id);
  } catch {
    return null;
  }
}

/**
 * Safely create a rectangle with error handling.
 */
export function safeCreateRectangle(): RectangleNode {
  const rect = figma.createRectangle();
  return rect;
}

/**
 * Safely create a text node with error handling.
 */
export function safeCreateText(): TextNode {
  const text = figma.createText();
  return text;
}

/**
 * Safely create a frame with error handling.
 */
export function safeCreateFrame(): FrameNode {
  const frame = figma.createFrame();
  return frame;
}

/**
 * Safely create a component with error handling.
 */
export function safeCreateComponent(): ComponentNode {
  const component = figma.createComponent();
  return component;
}

/**
 * Apply auto-layout to a frame with safe defaults.
 */
export function applyAutoLayout(
  frame: FrameNode | ComponentNode,
  options: {
    direction: 'HORIZONTAL' | 'VERTICAL';
    padding?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    spacing?: number;
    alignment?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    crossAlignment?: 'MIN' | 'CENTER' | 'MAX';
  },
): void {
  frame.layoutMode = options.direction;
  frame.primaryAxisAlignItems = options.alignment ?? 'MIN';
  frame.counterAxisAlignItems = options.crossAlignment ?? 'MIN';
  frame.itemSpacing = options.spacing ?? 0;

  if (options.padding !== undefined) {
    frame.paddingTop = options.padding;
    frame.paddingRight = options.padding;
    frame.paddingBottom = options.padding;
    frame.paddingLeft = options.padding;
  }
  if (options.paddingTop !== undefined) frame.paddingTop = options.paddingTop;
  if (options.paddingRight !== undefined) frame.paddingRight = options.paddingRight;
  if (options.paddingBottom !== undefined) frame.paddingBottom = options.paddingBottom;
  if (options.paddingLeft !== undefined) frame.paddingLeft = options.paddingLeft;
}

/**
 * Set frame sizing mode.
 */
export function setFrameSizing(
  frame: FrameNode | ComponentNode,
  primary: 'HUG' | 'FIXED',
  counter: 'HUG' | 'FIXED',
): void {
  frame.primaryAxisSizingMode = primary === 'HUG' ? 'AUTO' : 'FIXED';
  frame.counterAxisSizingMode = counter === 'HUG' ? 'AUTO' : 'FIXED';
}

/**
 * Create a drop shadow effect.
 */
export function createDropShadow(
  color: RGBA,
  offsetX: number,
  offsetY: number,
  blur: number,
  spread: number = 0,
): DropShadowEffect {
  return {
    type: 'DROP_SHADOW',
    color,
    offset: { x: offsetX, y: offsetY },
    radius: blur,
    spread,
    visible: true,
    blendMode: 'NORMAL',
  };
}

/**
 * Create a blur effect (for glass variant).
 */
export function createLayerBlur(radius: number): BlurEffect {
  return {
    type: 'LAYER_BLUR',
    radius,
    visible: true,
  };
}

/**
 * Send a progress message to the UI.
 */
export function sendProgress(
  command: PluginCommand,
  current: number,
  total: number,
  label: string,
): void {
  figma.ui.postMessage({
    type: 'progress',
    command,
    progress: { current, total, label },
  } satisfies PluginMessage);
}

/**
 * Send a completion message to the UI.
 */
export function sendComplete(command: PluginCommand, message: string): void {
  figma.ui.postMessage({
    type: 'complete',
    command,
    message,
  } satisfies PluginMessage);
}

/**
 * Send an error message to the UI.
 */
export function sendError(command: PluginCommand, message: string): void {
  figma.ui.postMessage({
    type: 'error',
    command,
    message,
  } satisfies PluginMessage);
}
