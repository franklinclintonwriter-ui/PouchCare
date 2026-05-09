function currentHostname() {
  if (typeof window === "undefined") return "";
  return window.location?.hostname || "";
}

export function isAdminSubdomainHost(hostname = currentHostname()) {
  const host = (hostname || "").toLowerCase();
  const forcedSubdomain = (import.meta.env.VITE_ADMIN_SUBDOMAIN || "admin").toLowerCase();
  if (!host) return false;
  if (host === `${forcedSubdomain}.localhost`) return true;
  return host.startsWith(`${forcedSubdomain}.`);
}

export function getAdminBasePath() {
  return isAdminSubdomainHost() ? "" : "/admin";
}

export function adminPath(path = "") {
  const base = getAdminBasePath();
  if (!path) return base || "/";
  if (path === "/") return base || "/";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isCustomerSubdomainHost(hostname = currentHostname()) {
  const host = (hostname || "").toLowerCase();
  const subdomain = (import.meta.env.VITE_CUSTOMER_SUBDOMAIN || "app").toLowerCase();
  if (!host) return false;
  if (host === `${subdomain}.localhost`) return true;
  return host.startsWith(`${subdomain}.`);
}

export function getCustomerBasePath() {
  return isCustomerSubdomainHost() ? "" : "/customer";
}

export function customerPath(path = "") {
  const base = getCustomerBasePath();
  if (!path || path === "/") return base || "/";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
