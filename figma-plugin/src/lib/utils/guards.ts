/**
 * Guard utilities: find-or-create pattern, duplicate detection, safe lookups.
 */

/**
 * Find an existing variable collection by name, or return null.
 */
export function findVariableCollection(name: string): VariableCollection | null {
  const collections = figma.variables.getLocalVariableCollections();
  return collections.find((c) => c.name === name) ?? null;
}

/**
 * Find an existing variable by name within a collection.
 */
export function findVariableByName(
  collection: VariableCollection,
  name: string,
): Variable | null {
  const allVars = collection.variableIds.map((id) => figma.variables.getVariableById(id));
  return allVars.find((v) => v !== null && v.name === name) ?? null;
}

/**
 * Find an existing text style by name.
 */
export function findTextStyle(name: string): TextStyle | null {
  const styles = figma.getLocalTextStyles();
  return styles.find((s) => s.name === name) ?? null;
}

/**
 * Find an existing paint style by name.
 */
export function findPaintStyle(name: string): PaintStyle | null {
  const styles = figma.getLocalPaintStyles();
  return styles.find((s) => s.name === name) ?? null;
}

/**
 * Find an existing component set by name on the current page or globally.
 */
export function findComponentSet(name: string): ComponentSetNode | null {
  const root = figma.root;
  for (const page of root.children) {
    const found = page.findOne(
      (n) => n.type === 'COMPONENT_SET' && n.name === name,
    ) as ComponentSetNode | null;
    if (found) return found;
  }
  return null;
}

/**
 * Find an existing component by name.
 */
export function findComponent(name: string): ComponentNode | null {
  const root = figma.root;
  for (const page of root.children) {
    const found = page.findOne(
      (n) => n.type === 'COMPONENT' && n.name === name,
    ) as ComponentNode | null;
    if (found) return found;
  }
  return null;
}

/**
 * Find or create a page by name.
 */
export function findOrCreatePage(name: string): PageNode {
  const existing = figma.root.children.find((p) => p.name === name);
  if (existing) return existing;

  const page = figma.createPage();
  page.name = name;
  return page;
}

/**
 * Find a mode by name within a collection.
 */
export function findMode(
  collection: VariableCollection,
  modeName: string,
): { modeId: string } | null {
  const mode = collection.modes.find((m) => m.name === modeName);
  return mode ? { modeId: mode.modeId } : null;
}

/**
 * Count existing variables in the file to warn about clutter.
 */
export function countExistingVariables(): number {
  const collections = figma.variables.getLocalVariableCollections();
  let count = 0;
  for (const collection of collections) {
    count += collection.variableIds.length;
  }
  return count;
}

/**
 * Remove all nodes created by the plugin (tracked by IDs).
 */
export function removeTrackedNodes(nodeIds: string[]): number {
  let removed = 0;
  for (const id of nodeIds) {
    const node = figma.getNodeById(id);
    if (node && 'remove' in node) {
      (node as SceneNode).remove();
      removed++;
    }
  }
  return removed;
}

/**
 * Clear all theme-related variables and styles.
 */
export function clearThemeVariables(): {
  collectionsRemoved: number;
  textStylesRemoved: number;
  paintStylesRemoved: number;
} {
  let collectionsRemoved = 0;
  let textStylesRemoved = 0;
  let paintStylesRemoved = 0;

  const collections = figma.variables.getLocalVariableCollections();
  for (const collection of collections) {
    if (collection.name === 'Theme') {
      for (const varId of collection.variableIds) {
        const variable = figma.variables.getVariableById(varId);
        if (variable) variable.remove();
      }
      collection.remove();
      collectionsRemoved++;
    }
  }

  const textStyles = figma.getLocalTextStyles();
  const themeTextPrefixes = ['Display/', 'Body/', 'Mono/'];
  for (const style of textStyles) {
    if (themeTextPrefixes.some((prefix) => style.name.startsWith(prefix))) {
      style.remove();
      textStylesRemoved++;
    }
  }

  const paintStyles = figma.getLocalPaintStyles();
  const themePaintPrefixes = ['Surface/', 'Accent/', 'Border/'];
  for (const style of paintStyles) {
    if (themePaintPrefixes.some((prefix) => style.name.startsWith(prefix))) {
      style.remove();
      paintStylesRemoved++;
    }
  }

  return { collectionsRemoved, textStylesRemoved, paintStylesRemoved };
}
