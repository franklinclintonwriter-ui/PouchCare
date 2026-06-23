/**
 * Plugin entry point: command router, state management, error boundary.
 * Design System Bootstrapper — PouchCare
 */

import { createThemeVariablesAndStyles } from './lib/tokens';
import { createContainersAndCards } from './lib/components';
import { createContentTemplates } from './lib/layouts';
import { createThemePreviews } from './lib/preview';
import { exportLibrarySnapshot } from './lib/export';
import { PluginOrchestrator } from './lib/orchestrator';
import { findVariableCollection } from './lib/utils/guards';
import { sendComplete, sendError } from './lib/utils/figma-api';
import uiHtml from './ui.html';

// ---------------------------------------------------------------------------
// Plugin state
// ---------------------------------------------------------------------------

const pluginState: PluginState = {
  lastCommand: null,
  createdNodes: [],
  errors: [],
  isProcessing: false,
};

const orchestrator = new PluginOrchestrator(pluginState);

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleTokens(): Promise<void> {
  const result = await createThemeVariablesAndStyles();
  const totalVars = result.variables.size;
  const totalModes = result.modes.size;
  sendComplete('tokens', `Created ${totalVars} variables across ${totalModes} modes, ${result.textStyles.size} text styles, ${result.paintStyles.size} paint styles`);
}

async function handleComponents(): Promise<void> {
  // Pre-check: ensure tokens exist
  const collection = findVariableCollection('Theme');
  if (!collection) {
    figma.notify('Tokens not found. Creating tokens first...', { timeout: 2000 });
    await createThemeVariablesAndStyles();
  }

  const result = await createContainersAndCards();
  sendComplete('components', `Created ${result.containers.size} containers and ${result.cards.size} card types`);
}

async function handleTemplates(): Promise<void> {
  // Pre-check: ensure tokens and components exist
  const collection = findVariableCollection('Theme');
  if (!collection) {
    figma.notify('Running prerequisite: tokens + components...', { timeout: 2000 });
    await createThemeVariablesAndStyles();
    await createContainersAndCards();
  }

  const result = await createContentTemplates();
  sendComplete('templates', `Created ${result.templateNames.length} templates with ${result.instanceCount} component instances`);
}

async function handlePreviews(): Promise<void> {
  const result = await createThemePreviews();
  const warningMsg = result.contrastWarnings.length > 0
    ? ` (${result.contrastWarnings.length} contrast warnings)`
    : '';
  sendComplete('previews', `Created 4 theme previews with ${result.nodeCount} nodes${warningMsg}`);
}

async function handleExport(): Promise<void> {
  const manifest = await exportLibrarySnapshot();
  sendComplete('export', `Exported: ${manifest.summary.components} components, ${manifest.summary.variables} variables, ${manifest.summary.styles} styles`);
}

async function handleBootstrap(): Promise<void> {
  await orchestrator.bootstrap();
}

function handleReset(): void {
  orchestrator.rollback();
}

// ---------------------------------------------------------------------------
// Command router
// ---------------------------------------------------------------------------

async function routeCommand(command: PluginCommand): Promise<void> {
  pluginState.lastCommand = command;
  pluginState.isProcessing = true;

  try {
    switch (command) {
      case 'tokens':
        await handleTokens();
        break;
      case 'components':
        await handleComponents();
        break;
      case 'templates':
        await handleTemplates();
        break;
      case 'previews':
        await handlePreviews();
        break;
      case 'export':
        await handleExport();
        break;
      case 'bootstrap':
        await handleBootstrap();
        break;
      case 'reset':
        handleReset();
        break;
      default: {
        const exhaustiveCheck: never = command;
        figma.notify(`Unknown command: ${exhaustiveCheck as string}`, { error: true });
      }
    }

    if (command !== 'bootstrap' && command !== 'reset') {
      figma.notify(`${command} complete`, { timeout: 3000 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DS Bootstrapper] ${command} failed:`, err);
    figma.notify(`${command} failed: ${message}`, { error: true });
    sendError(command, message);

    pluginState.errors.push({
      command,
      message,
      timestamp: Date.now(),
    });
  } finally {
    pluginState.isProcessing = false;
  }
}

// ---------------------------------------------------------------------------
// Plugin initialization
// ---------------------------------------------------------------------------

function initPlugin(): void {
  // Check if launched from menu command or UI
  if (figma.command) {
    const command = figma.command as PluginCommand;

    // Show UI for all commands (to display progress)
    figma.showUI(uiHtml, { width: 340, height: 520, themeColors: true });

    // Route the command
    void routeCommand(command).then(() => {
      // Close plugin after a delay for notification visibility
      setTimeout(() => {
        figma.closePlugin();
      }, 500);
    });
  } else {
    // Opened without a specific command (e.g., from development menu)
    figma.showUI(uiHtml, { width: 340, height: 520, themeColors: true });
  }
}

// ---------------------------------------------------------------------------
// Message handler (from UI)
// ---------------------------------------------------------------------------

figma.ui.onmessage = (msg: UIMessage): void => {
  if (pluginState.isProcessing && msg.type === 'run-command') {
    figma.notify('Please wait for the current operation to complete.', { timeout: 2000 });
    return;
  }

  switch (msg.type) {
    case 'run-command':
      if (msg.command) {
        void routeCommand(msg.command);
      }
      break;
    case 'cancel':
      figma.closePlugin();
      break;
    case 'copy-manifest':
      // Handled in UI directly
      break;
  }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

initPlugin();
