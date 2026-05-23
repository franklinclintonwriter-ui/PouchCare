/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getNodeApiBase } from "../../../config/apiBase";

const LICENSE_STORAGE_KEY = "pouchcare_license_key";

function licenseListUrl() {
  const base = getNodeApiBase();
  return base ? `${base}/licenses` : "/wp-json/pouchcare/v1/license";
}

function licenseActivateUrl() {
  const base = getNodeApiBase();
  if (base) return `${base}/licenses/activate`;
  return "/wp-json/pouchcare/v1/license";
}

function licenseDeactivateUrl() {
  const base = getNodeApiBase();
  if (base) return `${base}/licenses/deactivate`;
  return "/wp-json/pouchcare/v1/license";
}

/** @type {React.Context<LicenseContextValue | null>} */
const LicenseContext = createContext(null);

/**
 * @typedef {Object} LicenseLimits
 * @property {number} maxWebsites
 * @property {number} maxSeats
 * @property {string[]} templates
 * @property {string} support
 * @property {boolean} updates
 * @property {boolean} customBlocks
 */

/**
 * @typedef {Object} LicenseContextValue
 * @property {string} plan
 * @property {LicenseLimits | null} limits
 * @property {string[]} features
 * @property {boolean} isLoading
 * @property {(key: string) => Promise<void>} activate
 * @property {() => Promise<void>} deactivate
 */

const PLAN_FEATURES = {
  community: ["MARKETPLACE"],
  starter: ["CUSTOM_TEMPLATES", "API_ACCESS", "MARKETPLACE"],
  growth: ["CUSTOM_TEMPLATES", "API_ACCESS", "MARKETPLACE", "SEO_MANAGER", "ANALYTICS", "TEAM_MANAGEMENT", "MULTI_COMPANY"],
  agency: ["CUSTOM_TEMPLATES", "API_ACCESS", "MARKETPLACE", "SEO_MANAGER", "ANALYTICS", "TEAM_MANAGEMENT", "MULTI_COMPANY", "WHITE_LABEL", "PRIORITY_SUPPORT"],
  enterprise: ["CUSTOM_TEMPLATES", "API_ACCESS", "MARKETPLACE", "SEO_MANAGER", "ANALYTICS", "TEAM_MANAGEMENT", "MULTI_COMPANY", "WHITE_LABEL", "PRIORITY_SUPPORT", "CUSTOM_BLOCKS"],
};

function normalizePlanKey(plan) {
  return String(plan || "community").toLowerCase();
}

/** Node GET /licenses returns { licenses: [...] } — derive UI plan + coarse limits */
function fromLicenseList(licenses) {
  if (!Array.isArray(licenses) || licenses.length === 0) {
    return { plan: "community", limits: null };
  }
  const lic = licenses[0];
  const plan = normalizePlanKey(lic.plan);
  const limits = {
    maxWebsites: typeof lic.maxSites === "number" ? lic.maxSites : 1,
    maxSeats: -1,
    templates: ["all"],
    support: "email",
    updates: true,
    customBlocks: true,
  };
  return { plan, limits };
}

export function LicenseProvider({ children }) {
  const [plan, setPlan] = useState("community");
  const [limits, setLimits] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Build auth headers — Node.js API uses Bearer token, WP uses nonce */
  const getHeaders = useCallback(() => {
    const headers = { "Content-Type": "application/json" };
    if (getNodeApiBase()) {
      const token = localStorage.getItem("pouchcare_admin_token") || localStorage.getItem("pouchcare_token");
      if (token) headers.Authorization = `Bearer ${token}`;
    } else {
      headers["X-WP-Nonce"] = typeof window !== "undefined" ? window.pouchcareNonce ?? "" : "";
    }
    return headers;
  }, []);

  const fetchLicense = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(licenseListUrl(), { headers: getHeaders() });
      if (!res.ok) {
        setPlan("community");
        setLimits(null);
        return;
      }
      const data = await res.json();
      if (data.allFeaturesFree) {
        setPlan("enterprise");
        setLimits(data.limits ?? null);
      } else if (Array.isArray(data.licenses)) {
        const { plan, limits } = fromLicenseList(data.licenses);
        setPlan(plan);
        setLimits(limits);
      } else {
        setPlan(normalizePlanKey(data.plan ?? "community"));
        setLimits(data.limits ?? null);
      }
    } catch {
      setPlan("community");
      setLimits(null);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  const activate = useCallback(async (key) => {
    try {
      setIsLoading(true);
      const res = await fetch(licenseActivateUrl(), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(
          getNodeApiBase()
            ? { licenseKey: key, siteUrl: window.location.origin }
            : { key },
        ),
      });
      if (!res.ok) throw new Error("Activation failed");
      const data = await res.json();
      localStorage.setItem(LICENSE_STORAGE_KEY, key);
      setPlan(
        normalizePlanKey(
          data.site?.plan ?? data.license?.plan ?? data.plan ?? "starter",
        ),
      );
      setLimits(data.limits ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  const deactivate = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
      await fetch(licenseDeactivateUrl(), {
        method: getNodeApiBase() ? "POST" : "DELETE",
        headers: getHeaders(),
        ...(getNodeApiBase()
          ? { body: JSON.stringify({ licenseKey: storedKey, siteUrl: window.location.origin }) }
          : {}),
      });
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      setPlan("community");
      setLimits(null);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  const features = useMemo(() => {
    const envFree =
      import.meta.env.VITE_ALL_FEATURES_FREE === "1" ||
      import.meta.env.VITE_ALL_FEATURES_FREE === "true";
    if (envFree) {
      return PLAN_FEATURES.enterprise;
    }
    const key = normalizePlanKey(plan);
    return PLAN_FEATURES[key] ?? PLAN_FEATURES.community;
  }, [plan]);

  const value = useMemo(
    () => ({ plan, limits, features, isLoading, activate, deactivate }),
    [plan, limits, features, isLoading, activate, deactivate],
  );

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicense must be used within LicenseProvider");
  return ctx;
}
