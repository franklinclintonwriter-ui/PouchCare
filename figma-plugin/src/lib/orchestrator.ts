/**
 * Master orchestrator: coordinates all plugin operations with
 * transaction-like semantics, progress reporting, and error recovery.
 */

import { createThemeVariablesAndStyles, clearThemeVariables } from './tokens';
import { createContainersAndCards } from './components';
import { createContentTemplates } from './layouts';
import { createThemePreviews } from './preview';
import { exportLibrarySnapshot, validateIntegrity } from './export';
import { removeTrackedNodes, findVariableCollection } from './utils/guards';
import { sendProgress, sendComplete, sendError } from './utils/figma-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseResult {
  phase: string;
  success: boolean;
  duration: number;
  error?: string;
}

// OrchestratorReport type (available for external consumers)
export type OrchestratorReport = {
  phases: PhaseResult[];
  totalDuration: number;
  componentsCreated: number;
  variablesCreated: number;
  stylesCreated: number;
  pagesCreated: number;
  errors: string[];
};

// ---------------------------------------------------------------------------
// Orchestrator class
// ---------------------------------------------------------------------------

export class PluginOrchestrator {
  private state: PluginState;
  private phaseResults: PhaseResult[] = [];

  constructor(state: PluginState) {
    this.state = state;
  }

  /**
   * Phase 1: Foundation
   * Runs: tokens -> components -> previews
   */
  async bootstrap(): Promise<void> {
    const startTime = Date.now();
    this.state.isProcessing = true;

    try {
      // Step 1: Tokens
      await this.runPhase('tokens', async () => {
        sendProgress('bootstrap', 0, 3, 'Phase 1/3: Creating tokens...');
        await createThemeVariablesAndStyles();
      });

      // Step 2: Components
      await this.runPhase('components', async () => {
        sendProgress('bootstrap', 1, 3, 'Phase 2/3: Creating components...');
        await createContainersAndCards();
      });

      // Step 3: Previews
      await this.runPhase('previews', async () => {
        sendProgress('bootstrap', 2, 3, 'Phase 3/3: Creating previews...');
        await createThemePreviews();
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      sendComplete('bootstrap', `Bootstrap complete in ${duration}s`);
      figma.notify(`Bootstrap complete in ${duration}s`, { timeout: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendError('bootstrap', `Bootstrap failed: ${message}`);
      figma.notify(`Bootstrap failed: ${message}`, { error: true });
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Phase 2: Content
   * Runs: templates -> content placeholders
   */
  async buildTemplates(): Promise<void> {
    const startTime = Date.now();
    this.state.isProcessing = true;

    try {
      // Ensure tokens and components exist
      const collection = findVariableCollection('Theme');
      if (!collection) {
        figma.notify('Tokens not found. Running token creation first...', { timeout: 2000 });
        await createThemeVariablesAndStyles();
        await createContainersAndCards();
      }

      await this.runPhase('templates', async () => {
        sendProgress('templates', 0, 1, 'Creating content templates...');
        await createContentTemplates();
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      sendComplete('templates', `Templates built in ${duration}s`);
      figma.notify(`Templates built in ${duration}s`, { timeout: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendError('templates', `Template creation failed: ${message}`);
      figma.notify(`Template creation failed: ${message}`, { error: true });
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Phase 3: Polish
   * Runs: export -> cover page -> integrity check
   */
  async finalize(): Promise<void> {
    const startTime = Date.now();
    this.state.isProcessing = true;

    try {
      await this.runPhase('export', async () => {
        sendProgress('export', 0, 1, 'Finalizing and exporting...');
        await exportLibrarySnapshot();
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      sendComplete('export', `Export finalized in ${duration}s`);
      figma.notify(`Export finalized in ${duration}s`, { timeout: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendError('export', `Export failed: ${message}`);
      figma.notify(`Export failed: ${message}`, { error: true });
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Rollback: remove all created nodes and variables.
   */
  rollback(): void {
    this.state.isProcessing = true;

    try {
      // Remove tracked nodes
      const removedNodes = removeTrackedNodes(this.state.createdNodes);

      // Clear theme variables and styles
      const cleared = clearThemeVariables();

      // Remove pages created by plugin
      const pluginPages = ['Cover', 'Foundations', 'Templates'];
      let pagesRemoved = 0;
      for (const pageName of pluginPages) {
        const page = figma.root.children.find((p) => p.name === pageName);
        if (page && figma.root.children.length > 1) {
          page.remove();
          pagesRemoved++;
        }
      }

      this.state.createdNodes = [];
      this.state.errors = [];
      this.state.lastCommand = null;

      const summary = [
        `Nodes removed: ${removedNodes}`,
        `Collections: ${cleared.collectionsRemoved}`,
        `Text styles: ${cleared.textStylesRemoved}`,
        `Paint styles: ${cleared.paintStylesRemoved}`,
        `Pages: ${pagesRemoved}`,
      ].join(', ');

      figma.notify(`Reset complete. ${summary}`, { timeout: 3000 });
      sendComplete('reset', summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      figma.notify(`Reset failed: ${message}`, { error: true });
      sendError('reset', message);
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Validate current state.
   */
  async validate(): Promise<ValidationReport> {
    const integrity = validateIntegrity();
    const collection = findVariableCollection('Theme');

    const missingFonts: string[] = [];
    const requiredFonts = ['Orbitron', 'Inter', 'JetBrains Mono'];
    for (const fontFamily of requiredFonts) {
      try {
        await figma.loadFontAsync({ family: fontFamily, style: 'Regular' });
      } catch {
        missingFonts.push(fontFamily);
      }
    }

    return {
      isValid: integrity.valid && missingFonts.length === 0,
      tokensPresent: !!collection,
      componentsPresent: figma.root.findAll((n) => n.type === 'COMPONENT_SET').length > 0,
      templatesPresent: !!figma.root.children.find((p) => p.name === 'Templates'),
      previewsPresent: !!figma.root.children.find((p) => p.name === 'Foundations'),
      missingFonts,
      contrastWarnings: [],
      brokenReferences: integrity.brokenRefs,
      errors: [...integrity.brokenRefs, ...integrity.orphanedStyles],
    };
  }

  /**
   * Generate a human-readable summary report.
   */
  async generateReport(): Promise<string> {
    const report = await this.validate();
    const lines: string[] = [
      '=== Design System Bootstrapper Report ===',
      '',
      `Tokens: ${report.tokensPresent ? 'Present' : 'Missing'}`,
      `Components: ${report.componentsPresent ? 'Present' : 'Missing'}`,
      `Templates: ${report.templatesPresent ? 'Present' : 'Missing'}`,
      `Previews: ${report.previewsPresent ? 'Present' : 'Missing'}`,
      '',
    ];

    if (report.missingFonts.length > 0) {
      lines.push(`Missing fonts: ${report.missingFonts.join(', ')}`);
    }

    if (report.brokenReferences.length > 0) {
      lines.push(`Broken references: ${report.brokenReferences.length}`);
    }

    if (this.phaseResults.length > 0) {
      lines.push('', 'Phase Results:');
      for (const result of this.phaseResults) {
        const status = result.success ? 'OK' : 'FAILED';
        lines.push(`  ${result.phase}: ${status} (${(result.duration / 1000).toFixed(1)}s)`);
        if (result.error) {
          lines.push(`    Error: ${result.error}`);
        }
      }
    }

    const totalDuration = this.phaseResults.reduce((sum, r) => sum + r.duration, 0);
    lines.push('', `Total time: ${(totalDuration / 1000).toFixed(1)}s`);
    lines.push(`Overall: ${report.isValid ? 'HEALTHY' : 'ISSUES FOUND'}`);

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async runPhase(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await fn();
      this.phaseResults.push({
        phase: name,
        success: true,
        duration: Date.now() - start,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.phaseResults.push({
        phase: name,
        success: false,
        duration: Date.now() - start,
        error: message,
      });
      this.state.errors.push({
        command: name as PluginCommand,
        message,
        timestamp: Date.now(),
      });
      throw err;
    }
  }
}
