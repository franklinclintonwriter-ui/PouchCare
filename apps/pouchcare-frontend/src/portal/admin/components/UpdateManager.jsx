import { useState, useCallback } from "react";
import Button from "../../../components/ui/Button";
import { OpsPanel, StatusBadge } from "../../shared/components";

/**
 * @typedef {"idle"|"checking"|"downloading"|"installing"|"done"|"error"} UpdatePhase
 */

/**
 * @typedef {object} ComponentInfo
 * @property {string} slug
 * @property {string} label
 * @property {string} currentVersion
 * @property {string} latestVersion
 * @property {string|null} checkedAt
 * @property {UpdatePhase} phase
 * @property {string|null} error
 */

/**
 * @typedef {object} RollbackEntry
 * @property {string} version
 * @property {string} date
 */

const API_BASE = "/wp-json/pouchcare/v1/updates";

/** Map phase to a StatusBadge-friendly label */
const phaseLabel = /** @type {Record<UpdatePhase,string>} */ ({
  idle: "Up to date",
  checking: "Checking",
  downloading: "Downloading",
  installing: "Installing",
  done: "Updated",
  error: "Error",
});

/** Map phase to StatusBadge value (matching shared statusMap keys) */
const phaseStatus = /** @type {Record<UpdatePhase,string>} */ ({
  idle: "Active",
  checking: "Pending",
  downloading: "Pending",
  installing: "Pending",
  done: "Active",
  error: "Overdue",
});

/**
 * Full update management panel for PouchCare components.
 * Shows version info, check / update / rollback controls, and progress states.
 */
export default function UpdateManager() {
  const [components, setComponents] = useState(
    /** @type {ComponentInfo[]} */ ([
      {
        slug: "pouchcare-builder",
        label: "PouchCare Builder (Plugin)",
        currentVersion: "1.0.0",
        latestVersion: "1.0.0",
        checkedAt: null,
        phase: "idle",
        error: null,
      },
      {
        slug: "pouchcare-theme",
        label: "PouchCare Theme",
        currentVersion: "1.0.0",
        latestVersion: "1.0.0",
        checkedAt: null,
        phase: "idle",
        error: null,
      },
    ])
  );

  const [rollbackVersions] = useState(
    /** @type {RollbackEntry[]} */ ([
      { version: "0.9.2", date: "2026-04-20" },
      { version: "0.9.1", date: "2026-04-05" },
      { version: "0.9.0", date: "2026-03-15" },
    ])
  );

  const [rollingBack, setRollingBack] = useState(
    /** @type {string|null} */ (null)
  );

  /** Update a single component entry by slug */
  const patchComponent = useCallback(
    (slug, /** @type {Partial<ComponentInfo>} */ patch) => {
      setComponents((prev) =>
        prev.map((c) => (c.slug === slug ? { ...c, ...patch } : c))
      );
    },
    []
  );

  /** Check for updates via the REST endpoint */
  const handleCheckUpdates = useCallback(async () => {
    components.forEach((c) =>
      patchComponent(c.slug, { phase: "checking", error: null })
    );

    try {
      const res = await fetch(API_BASE + "/check", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      patchComponent("pouchcare-builder", {
        currentVersion: data.currentVersion ?? "1.0.0",
        latestVersion: data.latestVersion ?? "1.0.0",
        checkedAt: data.checkedAt ?? new Date().toISOString(),
        phase: data.updateAvailable ? "idle" : "idle",
        error: null,
      });

      // Theme — no dedicated endpoint yet, keep current
      patchComponent("pouchcare-theme", {
        checkedAt: new Date().toISOString(),
        phase: "idle",
      });
    } catch (err) {
      components.forEach((c) =>
        patchComponent(c.slug, {
          phase: "error",
          error: err instanceof Error ? err.message : "Check failed",
        })
      );
    }
  }, [components, patchComponent]);

  /** Trigger an update for one component */
  const handleUpdate = useCallback(
    async (slug) => {
      patchComponent(slug, { phase: "downloading", error: null });

      try {
        // Simulate download phase
        await new Promise((r) => setTimeout(r, 1200));
        patchComponent(slug, { phase: "installing" });

        const res = await fetch(API_BASE + "/apply", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ component: slug }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        patchComponent(slug, {
          phase: "done",
          currentVersion: data.newVersion ?? "unknown",
          latestVersion: data.newVersion ?? "unknown",
        });
      } catch (err) {
        patchComponent(slug, {
          phase: "error",
          error: err instanceof Error ? err.message : "Update failed",
        });
      }
    },
    [patchComponent]
  );

  /** Rollback to a previous version */
  const handleRollback = useCallback(
    async (version) => {
      setRollingBack(version);

      try {
        const res = await fetch(API_BASE + "/rollback", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previous_version: version }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        patchComponent("pouchcare-builder", {
          currentVersion: data.rolledBackTo ?? version,
          phase: "idle",
        });
      } catch {
        // Silently handled — user sees no phase change
      } finally {
        setRollingBack(null);
      }
    },
    [patchComponent]
  );

  const isUpdatable = (/** @type {ComponentInfo} */ c) =>
    c.phase === "idle" && c.currentVersion !== c.latestVersion;

  return (
    <div className="space-y-6">
      {/* ─── Component versions ─── */}
      <OpsPanel
        title="Installed Components"
        subtitle="PouchCare plugin and theme versions"
        actions={
          <Button size="sm" variant="secondary" onClick={handleCheckUpdates}>
            Check for Updates
          </Button>
        }
      >
        <div className="divide-y divide-slate-100">
          {components.map((c) => (
            <div
              key={c.slug}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{c.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Current:&nbsp;
                  <span className="font-semibold text-slate-700">
                    v{c.currentVersion}
                  </span>
                  {c.currentVersion !== c.latestVersion && (
                    <>
                      <span className="mx-1">&rarr;</span>
                      Latest:&nbsp;
                      <span className="font-semibold text-emerald-600">
                        v{c.latestVersion}
                      </span>
                    </>
                  )}
                </p>
                {c.checkedAt && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Last checked: {new Date(c.checkedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge value={phaseStatus[c.phase]} className="text-[11px]" />
                <span className="text-[11px] text-slate-500">
                  {phaseLabel[c.phase]}
                </span>

                {isUpdatable(c) && (
                  <Button size="sm" onClick={() => handleUpdate(c.slug)}>
                    Update
                  </Button>
                )}

                {(c.phase === "downloading" || c.phase === "installing") && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}

                {c.error && (
                  <span className="text-xs text-rose-600">{c.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </OpsPanel>

      {/* ─── Rollback ─── */}
      <OpsPanel
        title="Rollback"
        subtitle="Revert PouchCare Builder to a previous version"
      >
        {rollbackVersions.length === 0 ? (
          <p className="text-sm text-slate-500">No previous versions available.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rollbackVersions.map((rv) => (
              <div
                key={rv.version}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    v{rv.version}
                  </p>
                  <p className="text-[11px] text-slate-400">{rv.date}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={rollingBack !== null}
                  onClick={() => handleRollback(rv.version)}
                >
                  {rollingBack === rv.version ? "Rolling back..." : `Rollback to v${rv.version}`}
                </Button>
              </div>
            ))}
          </div>
        )}
      </OpsPanel>
    </div>
  );
}
