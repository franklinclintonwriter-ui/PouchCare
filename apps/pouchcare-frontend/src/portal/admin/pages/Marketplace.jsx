import { useState, useMemo, useCallback, useEffect } from "react";
import PageShell from "../../../components/ui/PageShell";
import Input from "../../../components/ui/Input";
import { MetricTile, StatusBadge } from "../../shared/components";
import { PLAN_HIERARCHY } from "../../shared/hooks/useFeatureGate.js";
import { useLicense } from "../../shared/state/LicenseContext.jsx";
import { buildRequestHeaders } from "../../shared/api/apiClient";

const API_BASE = "/wp-json/pouchcare/v1/marketplace";
const AUTH_TOKEN_KEYS = ["pouchcare_admin_token", "pouchcare_token", "auth_token"];
const RUNTIME_TOKEN_KEY = "__POUCHCARE_ADMIN_TOKEN__";

/** @type {Array<MarketplaceItem>} */
const MARKETPLACE_ITEMS = [
  { id: "mp-001", name: "Business starter", description: "Professional business template with hero, services, and contact sections.", category: "Starter Templates", rating: 4.8, installs: 1240, requiredPlan: "starter", installed: false },
  { id: "mp-002", name: "Portfolio starter", description: "Clean portfolio layout with project gallery and about page.", category: "Starter Templates", rating: 4.6, installs: 890, requiredPlan: "starter", installed: true },
  { id: "mp-003", name: "Testimonial carousel", description: "Animated testimonial slider with avatar, rating, and company info.", category: "Premium Blocks", rating: 4.9, installs: 2100, requiredPlan: "growth", installed: false },
  { id: "mp-004", name: "Pricing table pro", description: "Responsive pricing comparison table with toggle and feature list.", category: "Premium Blocks", rating: 4.7, installs: 1560, requiredPlan: "starter", installed: true },
  { id: "mp-005", name: "Schema markup generator", description: "Automatic JSON-LD schema generation for pages, posts, and products.", category: "SEO Tools", rating: 4.5, installs: 780, requiredPlan: "growth", installed: false },
  { id: "mp-006", name: "Meta tag optimizer", description: "Bulk edit meta titles and descriptions with AI suggestions.", category: "SEO Tools", rating: 4.4, installs: 650, requiredPlan: "growth", installed: false },
  { id: "mp-007", name: "WooCommerce quick view", description: "Ajax-powered product quick view modal for WooCommerce stores.", category: "E-Commerce", rating: 4.3, installs: 430, requiredPlan: "growth", installed: false },
  { id: "mp-008", name: "Cart abandonment recovery", description: "Automated email recovery for abandoned WooCommerce carts.", category: "E-Commerce", rating: 4.6, installs: 920, requiredPlan: "enterprise", installed: false },
  { id: "mp-009", name: "Heatmap tracker", description: "Visual heatmap recording of clicks, scrolls, and mouse movements.", category: "Analytics", rating: 4.2, installs: 340, requiredPlan: "enterprise", installed: false },
  { id: "mp-010", name: "Conversion funnel", description: "Track visitor journeys through custom conversion funnels.", category: "Analytics", rating: 4.5, installs: 510, requiredPlan: "growth", installed: false },
  { id: "mp-011", name: "Form builder pro", description: "Drag-and-drop form builder with conditional logic and Zapier integration.", category: "Starter Templates", rating: 4.7, installs: 1870, requiredPlan: "starter", installed: true },
  { id: "mp-012", name: "White-label dashboard", description: "Remove PouchCare branding and apply your own logo and colors.", category: "Premium Blocks", rating: 4.9, installs: 210, requiredPlan: "enterprise", installed: false },
];

const CATEGORIES = ["All", "Starter Templates", "Premium Blocks", "SEO Tools", "E-Commerce", "Analytics"];

/**
 * @typedef {Object} MarketplaceItem
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} rating
 * @property {number} installs
 * @property {string} requiredPlan
 * @property {boolean} installed
 */

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-current" : "fill-slate-200"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-slate-500">{value}</span>
    </span>
  );
}

function PlanBadge({ plan }) {
  const colorMap = {
    community: "bg-slate-100 text-slate-600",
    starter: "bg-sky-100 text-sky-700",
    growth: "bg-violet-100 text-violet-700",
    agency: "bg-emerald-100 text-emerald-800",
    enterprise: "bg-amber-100 text-amber-700",
  };
  const key = String(plan || "community").toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorMap[key] ?? colorMap.community}`}>
      {label}
    </span>
  );
}

function MarketplaceCard({ item, currentPlan, onInstall, isInstalling, mode }) {
  const envFree =
    import.meta.env.VITE_ALL_FEATURES_FREE === "1" ||
    import.meta.env.VITE_ALL_FEATURES_FREE === "true";
  const p = String(currentPlan || "community").toLowerCase();
  const r = String(item.requiredPlan || "community").toLowerCase();
  const currentRank = PLAN_HIERARCHY.indexOf(p);
  const requiredRank = PLAN_HIERARCHY.indexOf(r);
  const canInstall = envFree || (currentRank >= 0 && requiredRank >= 0 && currentRank >= requiredRank);
  const requiredLabel = item.requiredPlan.charAt(0).toUpperCase() + item.requiredPlan.slice(1);

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
        <PlanBadge plan={item.requiredPlan} />
      </div>

      <p className="mt-1 flex-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <Stars value={item.rating} />
        <span className="text-[11px] text-slate-400">{item.installs.toLocaleString()} installs</span>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {item.installed ? (
          <StatusBadge value="Installed" />
        ) : canInstall ? (
          <button
            type="button"
            disabled={isInstalling}
            onClick={() => onInstall(item.id)}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isInstalling
              ? "Installing..."
              : mode === "live"
                ? "Install"
                : "Mark Installed (Preview)"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
          >
            Upgrade to {requiredLabel}
          </button>
        )}
      </div>
    </div>
  );
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function normalizeItem(item) {
  return {
    id: String(item?.id || ""),
    name: String(item?.name || "Untitled item"),
    description: String(item?.description || ""),
    category: String(item?.category || "Starter Templates"),
    rating: Number(item?.rating || 0),
    installs: Number(item?.installs || 0),
    requiredPlan: String(item?.requiredPlan || "community").toLowerCase(),
    installed: Boolean(item?.installed),
  };
}

export default function Marketplace() {
  const { plan } = useLicense();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState(MARKETPLACE_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [installingId, setInstallingId] = useState(/** @type {string|null} */ (null));
  const [mode, setMode] = useState("preview");
  const [notice, setNotice] = useState("Loading marketplace...");

  const wpHeaders = useCallback(
    (extra = {}) =>
      buildRequestHeaders(AUTH_TOKEN_KEYS, RUNTIME_TOKEN_KEY, {
        Accept: "application/json",
        ...extra,
      }),
    []
  );

  const loadMarketplace = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch(API_BASE, {
        credentials: "same-origin",
        headers: wpHeaders(),
      });

      const data = await parseJsonSafe(res);

      if (!res.ok || !Array.isArray(data?.items)) {
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }

      setItems(data.items.map(normalizeItem));
      setMode("live");
      setNotice(
        "Connected to WP marketplace API. Install action is backend-simulated and records install status only."
      );
    } catch (err) {
      setMode("preview");
      setItems(MARKETPLACE_ITEMS);
      setNotice(
        `Marketplace API unavailable (${err instanceof Error ? err.message : "error"}). Showing preview catalog with local-only install state.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [wpHeaders]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const filtered = useMemo(() => {
    let result = items;
    if (category !== "All") {
      result = result.filter((i) => i.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, category, search]);

  const totalPlugins = items.length;
  const installedCount = items.filter((i) => i.installed).length;

  const handleInstall = useCallback(
    async (id) => {
      if (mode !== "live") {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, installed: true } : i)));
        setNotice("Preview mode: item marked installed locally only.");
        return;
      }

      setInstallingId(id);
      try {
        const res = await fetch(`${API_BASE}/install`, {
          method: "POST",
          credentials: "same-origin",
          headers: wpHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id }),
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) {
          const requiredPlan = data?.requiredPlan ? ` Required plan: ${data.requiredPlan}.` : "";
          throw new Error((data?.message || data?.error || `HTTP ${res.status}`) + requiredPlan);
        }

        const installedItem = normalizeItem(data?.item || {});
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...installedItem, installed: true } : i))
        );
        setNotice(
          "Install recorded by backend. This backend currently simulates installation and persists install state metadata."
        );
      } catch (err) {
        setNotice(`Install failed: ${err instanceof Error ? err.message : "Unexpected error"}`);
      } finally {
        setInstallingId(null);
      }
    },
    [mode, wpHeaders]
  );

  return (
    <PageShell
      title="PouchCare Marketplace"
      description="Discover plugins, templates, and tools to extend your websites."
    >
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {notice}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricTile label="Total Plugins" value={totalPlugins} hint="Available in marketplace" />
        <MetricTile label="Installed" value={installedCount} hint="Active on your sites" />
        <MetricTile
          label="Backend Mode"
          value={mode === "live" ? "Live API" : "Preview"}
          hint={mode === "live" ? "Connected to WP REST" : "Local catalog fallback"}
        />
      </div>

      <div className="mt-4">
        <Input
          placeholder="Search marketplace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-48">
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  category === cat
                    ? "bg-primary font-medium text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Loading marketplace...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No items match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  currentPlan={plan}
                  onInstall={handleInstall}
                  isInstalling={installingId === item.id}
                  mode={mode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
