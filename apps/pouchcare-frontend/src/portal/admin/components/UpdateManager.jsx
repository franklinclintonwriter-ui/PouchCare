import { useState, useCallback } from "react";
import Button from "../../../components/ui/Button";
import { OpsPanel, StatusBadge } from "../../shared/components";
import { buildRequestHeaders } from "../../shared/api/apiClient";

/**
 * @typedef {"idle"|"checking"|"installing"|"done"|"error"} UpdatePhase
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
const AUTH_TOKEN_KEYS = ["pouchcare_admin_token", "pouchcare_token", "auth_token"];
const RUNTIME_TOKEN_KEY = "__POUCHCARE_ADMIN_TOKEN__";

const SIMULATION_NOTE =
  "Update apply and rollback are currently backend-simulated operations (version metadata and history only).";

const DEFAULT_COMPONENTS = /** @type {ComponentInfo[]} */ ([
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
]);

const DEFAULT_ROLLBACK_VERSIONS = /** @type {RollbackEntry[]} */ ([
  { version: "0.9.2", date: "2026-04-20" },
  { version: "0.9.1", date: "2026-04-05" },
  { version: "0.9.0", date: "2026-03-15" },
]);

const phaseLabel = /** @type {Record<UpdatePhase,string>} */ ({
  idle: "Up to date",
  checking: "Checking",
  installing: "Installing",
  done: "Updated",
  error: "Error",
});

const phaseStatus = /** @type {Record<UpdatePhase,string>} */ ({
  idle: "Active",
  checking: "Pending",
  installing: "Pending",
  done: "Active",
  error: "Overdue",
});

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function UpdateManager() {
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);
  const [rollbackVersions, setRollbackVersions] = useState(DEFAULT_ROLLBACK_VERSIONS);
  const [rollingBack, setRollingBack] = useState(/** @type {string|null} */ (null));
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(SIMULATION_NOTE);

  const wpHeaders = useCallback(
    (extra = {}) =>
      buildRequestHeaders(AUTH_TOKEN_KEYS, RUNTIME_TOKEN_KEY, {
        Accept: "application/json",
        ...extra,
      }),
    []
  );

  const patchComponent = useCallback((slug, /** @type {Partial<ComponentInfo>} */ patch) => {
    setComponents((prev) => prev.map((c) => (c.slug === slug ? { ...c, ...patch } : c)));
  }, []);

  const handleCheckUpdates = useCallback(async () => {
    setIsChecking(true);
    setStatusMessage(SIMULATION_NOTE);

    setComponents((prev) => prev.map((c) => ({ ...c, phase: "checking", error: null })));

    try {
      const [checkRes, changelogRes] = await Promise.all([
        fetch(`${API_BASE}/check`, {
          credentials: "same-origin",
          headers: wpHeaders(),
        }),
        fetch(`${API_BASE}/changelog`, {
          credentials: "same-origin",
          headers: wpHeaders(),
        }),
      ]);

      if (!checkRes.ok) {
        throw new Error(`HTTP ${checkRes.status}`);
      }

      const checkData = await parseJsonSafe(checkRes);

      patchComponent("pouchcare-builder", {
        currentVersion: checkData.currentVersion ?? "1.0.0",
        latestVersion: checkData.latestVersion ?? checkData.currentVersion ?? "1.0.0",
        checkedAt: checkData.checkedAt ?? new Date().toISOString(),
        phase: "idle",
        error: null,
      });

      patchComponent("pouchcare-theme", {
        checkedAt: new Date().toISOString(),
        phase: "idle",
        error: null,
      });

      if (changelogRes.ok) {
        const changelogData = await parseJsonSafe(changelogRes);
        const entries = Array.isArray(changelogData?.changelog)
          ? changelogData.changelog
              .filter((entry) => typeof entry?.version === "string")
              .map((entry) => ({
                version: entry.version,
                date: typeof entry.date === "string" ? entry.date : "",
              }))
          : [];

        if (entries.length > 0) {
          setRollbackVersions(entries);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      setComponents((prev) => prev.map((c) => ({ ...c, phase: "error", error: msg })));
      setStatusMessage(`Unable to load updates from backend: ${msg}`);
    } finally {
      setIsChecking(false);
    }
  }, [patchComponent, wpHeaders]);

  const handleUpdate = useCallback(
    async (slug) => {
      patchComponent(slug, { phase: "installing", error: null });

      try {
        const res = await fetch(`${API_BASE}/apply`, {
          method: "POST",
          credentials: "same-origin",
          headers: wpHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ component: slug }),
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
        }

        const nextVersion = data?.newVersion ?? "unknown";
        patchComponent(slug, {
          phase: "done",
          currentVersion: nextVersion,
          latestVersion: nextVersion,
          checkedAt: data?.updatedAt || new Date().toISOString(),
          error: null,
        });

        setStatusMessage(SIMULATION_NOTE);
      } catch (err) {
        patchComponent(slug, {
          phase: "error",
          error: err instanceof Error ? err.message : "Update failed",
        });
      }
    },
    [patchComponent, wpHeaders]
  );

  const handleRollback = useCallback(
    async (version) => {
      setRollingBack(version);

      try {
        const res = await fetch(`${API_BASE}/rollback`, {
          method: "POST",
          credentials: "same-origin",
          headers: wpHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ previous_version: version }),
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
        }

        patchComponent("pouchcare-builder", {
          currentVersion: data?.rolledBackTo ?? version,
          latestVersion: data?.rolledBackTo ?? version,
          checkedAt: data?.rolledBackAt || new Date().toISOString(),
          phase: "idle",
          error: null,
        });

        setStatusMessage(SIMULATION_NOTE);
      } catch (err) {
        setStatusMessage(
          `Rollback failed: ${err instanceof Error ? err.message : "Unexpected error"}`
        );
      } finally {
        setRollingBack(null);
      }
    },
    [patchComponent, wpHeaders]
  );

  const isUpdatable = (/** @type {ComponentInfo} */ c) =>
    c.phase === "idle" && c.currentVersion !== c.latestVersion;

  return (
    <div className="space-y-6">
      <OpsPanel
        title="Installed Components"
        subtitle="PouchCare plugin and theme versions"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCheckUpdates}
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Check for Updates"}
          </Button>
        }
      >
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {statusMessage}
        </p>

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
                  <span className="font-semibold text-slate-700">v{c.currentVersion}</span>
                  {c.currentVersion !== c.latestVersion && (
                    <>
                      <span className="mx-1">&rarr;</span>
                      Latest:&nbsp;
                      <span className="font-semibold text-emerald-600">v{c.latestVersion}</span>
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
                <span className="text-[11px] text-slate-500">{phaseLabel[c.phase]}</span>

                {isUpdatable(c) && (
                  <Button size="sm" onClick={() => handleUpdate(c.slug)}>
                    Update
                  </Button>
                )}

                {c.phase === "checking" || c.phase === "installing" ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : null}

                {c.error ? <span className="text-xs text-rose-600">{c.error}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </OpsPanel>

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
                  <p className="text-sm font-medium text-slate-800">v{rv.version}</p>
                  <p className="text-[11px] text-slate-400">{rv.date}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={rollingBack !== null}
                  onClick={() => handleRollback(rv.version)}
                >
                  {rollingBack === rv.version
                    ? "Rolling back..."
                    : `Rollback to v${rv.version}`}
                </Button>
              </div>
            ))}
          </div>
        )}
      </OpsPanel>
    </div>
  );
}