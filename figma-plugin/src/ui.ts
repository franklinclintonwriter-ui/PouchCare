/**
 * UI logic module.
 * Handles message passing between the UI iframe and the plugin main thread.
 * This file is bundled separately if needed, but the inline script in ui.html
 * handles the basic functionality. This module provides type-safe wrappers
 * for more complex UI interactions.
 */

/** Post a command message to the plugin. */
export function postCommand(command: PluginCommand): void {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'run-command',
        command,
      } satisfies UIMessage,
    },
    '*',
  );
}

/** Post a cancel message to the plugin. */
export function postCancel(): void {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'cancel',
      } satisfies UIMessage,
    },
    '*',
  );
}

/** Post a copy-manifest request to the plugin. */
export function postCopyManifest(): void {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'copy-manifest',
      } satisfies UIMessage,
    },
    '*',
  );
}

/**
 * Parse an incoming plugin message with type safety.
 */
export function parsePluginMessage(event: MessageEvent): PluginMessage | null {
  const msg = (event.data as { pluginMessage?: PluginMessage }).pluginMessage;
  if (!msg || typeof msg.type !== 'string') return null;
  return msg;
}

/**
 * Format a progress message for display.
 */
export function formatProgress(progress: {
  current: number;
  total: number;
  label: string;
}): string {
  const percentage = Math.round((progress.current / progress.total) * 100);
  return `${progress.label} (${percentage}%)`;
}

/**
 * Format an error for user-friendly display.
 */
export function formatError(message: string): string {
  // Truncate long error messages
  const maxLength = 200;
  if (message.length > maxLength) {
    return message.substring(0, maxLength) + '...';
  }
  return message;
}
