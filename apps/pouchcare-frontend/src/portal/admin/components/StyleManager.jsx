import { useState, useCallback, useEffect } from "react";
import PageShell from "../../../components/ui/PageShell";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { OpsPanel } from "../../shared/components";
import { Save, RotateCcw, Palette } from "lucide-react";
import defaultTokens from "../../../../shared/schemas/design-tokens.json";
import { fetchDesignTokens, persistDesignTokens } from "../api/adminPortalRepository";

/**
 * @typedef {Object} TokenState
 * @property {string} primaryColor
 * @property {string} primaryDark
 * @property {string} accentCyan
 * @property {string} accentGold
 * @property {string} accentOrange
 * @property {string} headingFont
 * @property {string} bodyFont
 * @property {string} borderRadiusCard
 * @property {string} borderRadiusButton
 */

/**
 * Builds a fresh TokenState from the default design-tokens.json values.
 * @returns {TokenState}
 */
function getDefaults() {
  return {
    primaryColor: defaultTokens.colors.primary.DEFAULT,
    primaryDark: defaultTokens.colors.primary.dark,
    accentCyan: defaultTokens.colors.accent.cyan,
    accentGold: defaultTokens.colors.accent.gold,
    accentOrange: defaultTokens.colors.accent.orange,
    headingFont: defaultTokens.typography.fontFamilies.heading,
    bodyFont: defaultTokens.typography.fontFamilies.body,
    borderRadiusCard: defaultTokens.borderRadius.card,
    borderRadiusButton: defaultTokens.borderRadius.button,
  };
}

const FONT_OPTIONS = [
  { value: "Plus Jakarta Sans, sans-serif", label: "Plus Jakarta Sans" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "custom", label: "Custom..." },
];

/**
 * Inline color swatch + native color picker input.
 * @param {{ label: string, value: string, onChange: (v: string) => void }} props
 */
function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-slate-200 p-0.5"
      />
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-slate-700">{label}</span>
        <span className="block text-xs font-mono text-slate-400">{value}</span>
      </div>
    </label>
  );
}

/**
 * StyleManager component for editing PouchCare theme design tokens.
 * Shows color pickers, font selectors, border-radius controls, and a live preview.
 * @returns {JSX.Element}
 */
export default function StyleManager() {
  const [tokens, setTokens] = useState(getDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next = await fetchDesignTokens(getDefaults());
      if (!cancelled) {
        setTokens(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    /** @param {keyof TokenState} key @param {string} value */
    (key, value) => {
      setTokens((prev) => ({ ...prev, [key]: value }));
      setSaved(false);
    },
    []
  );

  const handleReset = () => {
    setTokens(getDefaults());
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const remote = await persistDesignTokens(tokens);
      if (!remote.ok && !remote.skipped) {
        throw new Error(remote.error?.message || "Save failed");
      }
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Style Manager"
      description="Edit design tokens that drive the PouchCare theme appearance."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReset}>
            Reset
          </Button>
          <Button
            size="sm"
            icon={Save}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Tokens"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="mb-4 text-sm text-slate-500">Loading saved design tokens…</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Color tokens */}
        <OpsPanel title="Colors" subtitle="Brand and accent palette">
          <div className="space-y-4">
            <ColorField
              label="Primary"
              value={tokens.primaryColor}
              onChange={(v) => update("primaryColor", v)}
            />
            <ColorField
              label="Primary Dark"
              value={tokens.primaryDark}
              onChange={(v) => update("primaryDark", v)}
            />
            <ColorField
              label="Accent Cyan"
              value={tokens.accentCyan}
              onChange={(v) => update("accentCyan", v)}
            />
            <ColorField
              label="Accent Gold"
              value={tokens.accentGold}
              onChange={(v) => update("accentGold", v)}
            />
            <ColorField
              label="Accent Orange"
              value={tokens.accentOrange}
              onChange={(v) => update("accentOrange", v)}
            />
          </div>
        </OpsPanel>

        {/* Typography tokens */}
        <OpsPanel title="Typography" subtitle="Font families and sizing">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Heading Font
              </label>
              <Select
                value={FONT_OPTIONS.some((f) => f.value === tokens.headingFont) ? tokens.headingFont : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") update("headingFont", e.target.value);
                }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
              {!FONT_OPTIONS.some((f) => f.value === tokens.headingFont) && (
                <Input
                  className="mt-2"
                  placeholder="Custom font family..."
                  value={tokens.headingFont}
                  onChange={(e) => update("headingFont", e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Body Font
              </label>
              <Select
                value={FONT_OPTIONS.some((f) => f.value === tokens.bodyFont) ? tokens.bodyFont : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") update("bodyFont", e.target.value);
                }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
              {!FONT_OPTIONS.some((f) => f.value === tokens.bodyFont) && (
                <Input
                  className="mt-2"
                  placeholder="Custom font family..."
                  value={tokens.bodyFont}
                  onChange={(e) => update("bodyFont", e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Card Border Radius
              </label>
              <Input
                value={tokens.borderRadiusCard}
                onChange={(e) => update("borderRadiusCard", e.target.value)}
                placeholder="e.g. 12px"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Button Border Radius
              </label>
              <Input
                value={tokens.borderRadiusButton}
                onChange={(e) => update("borderRadiusButton", e.target.value)}
                placeholder="e.g. 8px"
              />
            </div>
          </div>
        </OpsPanel>

        {/* Live preview */}
        <OpsPanel title="Preview" subtitle="Live token preview">
          <div className="space-y-4">
            {/* Button preview */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Button</p>
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor: tokens.primaryColor,
                  borderRadius: tokens.borderRadiusButton,
                  fontFamily: tokens.bodyFont,
                }}
              >
                Get Started
              </button>
            </div>

            {/* Card preview */}
            <div
              className="border border-slate-200 p-4"
              style={{ borderRadius: tokens.borderRadiusCard }}
            >
              <h4
                className="text-base font-bold"
                style={{
                  fontFamily: tokens.headingFont,
                  color: defaultTokens.colors.text.heading,
                }}
              >
                Card Title
              </h4>
              <p
                className="mt-1 text-sm"
                style={{
                  fontFamily: tokens.bodyFont,
                  color: defaultTokens.colors.text.body,
                }}
              >
                This is how body text looks with your current font selection.
              </p>
            </div>

            {/* Color swatches */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Palette</p>
              <div className="flex gap-2">
                {[
                  tokens.primaryColor,
                  tokens.primaryDark,
                  tokens.accentCyan,
                  tokens.accentGold,
                  tokens.accentOrange,
                ].map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-md border border-slate-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Accent bar */}
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">
                {saved ? "Tokens saved successfully" : "Unsaved changes"}
              </span>
            </div>
          </div>
        </OpsPanel>
      </div>
    </PageShell>
  );
}
