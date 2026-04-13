/**
 * Mock security data: sessions, login history, notification preferences.
 * Replace with API calls when backend supports these endpoints.
 * @see docs/TASKS_PROFILE_SECURITY.md
 */

export type SessionDevice = "Desktop" | "Mobile" | "Tablet";
export type SessionBrowser = "Chrome" | "Firefox" | "Safari" | "Edge" | "App";

export interface MockSession {
  id: string;
  device: SessionDevice;
  browser: SessionBrowser;
  os: string;
  location: string;
  ip: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface MockLoginEntry {
  id: string;
  timestamp: string;
  ip: string;
  device: SessionDevice;
  browser: SessionBrowser;
  location: string;
  status: "success" | "failed" | "blocked";
}

export interface MockNotifPrefs {
  orderUpdates: boolean;
  billingAlerts: boolean;
  systemAlerts: boolean;
  newFeatures: boolean;
  marketingEmails: boolean;
  smsAlerts: boolean;
}

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: "sess-current",
    device: "Desktop",
    browser: "Chrome",
    os: "Windows 11",
    location: "Dhaka, BD",
    ip: "103.58.x.x",
    lastSeen: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: "sess-mobile",
    device: "Mobile",
    browser: "Chrome",
    os: "Android 14",
    location: "Dhaka, BD",
    ip: "103.58.x.x",
    lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
  {
    id: "sess-safari",
    device: "Tablet",
    browser: "Safari",
    os: "iPadOS 17",
    location: "Singapore, SG",
    ip: "182.20.x.x",
    lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
  {
    id: "sess-edge",
    device: "Desktop",
    browser: "Edge",
    os: "Windows 10",
    location: "London, GB",
    ip: "78.105.x.x",
    lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
];

export const MOCK_LOGIN_HISTORY: MockLoginEntry[] = [
  {
    id: "log-1",
    timestamp: new Date().toISOString(),
    ip: "103.58.x.x",
    device: "Desktop",
    browser: "Chrome",
    location: "Dhaka, BD",
    status: "success",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    ip: "103.58.x.x",
    device: "Mobile",
    browser: "Chrome",
    location: "Dhaka, BD",
    status: "success",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ip: "5.188.x.x",
    device: "Desktop",
    browser: "Firefox",
    location: "Moscow, RU",
    status: "failed",
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ip: "103.58.x.x",
    device: "Desktop",
    browser: "Chrome",
    location: "Dhaka, BD",
    status: "success",
  },
  {
    id: "log-5",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "182.20.x.x",
    device: "Tablet",
    browser: "Safari",
    location: "Singapore, SG",
    status: "success",
  },
  {
    id: "log-6",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "1.2.x.x",
    device: "Desktop",
    browser: "Chrome",
    location: "Unknown",
    status: "blocked",
  },
  {
    id: "log-7",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "103.58.x.x",
    device: "Desktop",
    browser: "Chrome",
    location: "Dhaka, BD",
    status: "success",
  },
  {
    id: "log-8",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "78.105.x.x",
    device: "Desktop",
    browser: "Edge",
    location: "London, GB",
    status: "success",
  },
];

const NOTIF_PREFS_KEY = "pouchcare_notif_prefs_v1";

export const DEFAULT_NOTIF_PREFS: MockNotifPrefs = {
  orderUpdates: true,
  billingAlerts: true,
  systemAlerts: true,
  newFeatures: true,
  marketingEmails: false,
  smsAlerts: false,
};

export function loadNotifPrefs(): MockNotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return { ...DEFAULT_NOTIF_PREFS, ...(JSON.parse(raw) as Partial<MockNotifPrefs>) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_NOTIF_PREFS };
}

export function saveNotifPrefs(prefs: MockNotifPrefs): void {
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

const APPEARANCE_KEY = "pouchcare_appearance_v1";
export type AppearanceMode = "light" | "dark" | "system";

export function loadAppearance(): AppearanceMode {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY) as AppearanceMode | null;
    if (raw && ["light", "dark", "system"].includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export function saveAppearance(mode: AppearanceMode): void {
  try {
    localStorage.setItem(APPEARANCE_KEY, mode);
  } catch {
    /* ignore */
  }
}
