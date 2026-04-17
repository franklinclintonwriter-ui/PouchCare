import { prisma } from './prisma';

interface SystemSettingValue {
  [key: string]: any;
}

let settingsCache: Record<string, any> = {};
let cacheLoadedAt: Date | null = null;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export const getSystemSetting = async <T = any>(key: string, defaultValue: T): Promise<T> => {
  // Check memory cache
  const now = new Date();
  if (!cacheLoadedAt || now.getTime() - cacheLoadedAt.getTime() > CACHE_TTL_MS) {
    await refreshSystemSettingsCache();
  }

  if (settingsCache.hasOwnProperty(key)) {
    return settingsCache[key] as T;
  }

  return defaultValue;
};

export const getSystemSettingsGroup = async (group: string): Promise<Record<string, any>> => {
  const now = new Date();
  if (!cacheLoadedAt || now.getTime() - cacheLoadedAt.getTime() > CACHE_TTL_MS) {
    await refreshSystemSettingsCache();
  }

  // We need group mapping, so we can either load all and filter or query directly.
  const settings = await prisma.systemSetting.findMany({ where: { group } });
  const result: Record<string, any> = {};
  for (const s of settings) {
    result[s.key] = parseSettingValue(s.value, s.type);
  }
  return result;
};

export const refreshSystemSettingsCache = async () => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const newCache: Record<string, any> = {};
    for (const s of settings) {
      newCache[s.key] = parseSettingValue(s.value, s.type);
    }
    settingsCache = newCache;
    cacheLoadedAt = new Date();
  } catch (error) {
    console.error('Failed to refresh system settings cache:', error);
  }
};

export const parseSettingValue = (value: string, type: string): any => {
  switch (type) {
    case 'boolean':
      return value === 'true';
    case 'number':
      return Number(value);
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    default:
      return value;
  }
};

export const serializeSettingValue = (value: any, type: string): string => {
  switch (type) {
    case 'boolean':
      return String(Boolean(value));
    case 'number':
      return String(Number(value));
    case 'json':
      return JSON.stringify(value);
    default:
      return String(value);
  }
};

export const clearSystemSettingsCache = () => {
  settingsCache = {};
  cacheLoadedAt = null;
};
