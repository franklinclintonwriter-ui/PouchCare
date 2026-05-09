const THEME_FALLBACK = "/downloads/pouchcare-theme-0.1.0.zip";
const PLUGIN_FALLBACK = "/downloads/pouchcare-builder-0.1.0.zip";

export const downloadLinks = {
  theme: (import.meta.env.VITE_THEME_DOWNLOAD_URL || THEME_FALLBACK).trim(),
  plugin: (import.meta.env.VITE_PLUGIN_DOWNLOAD_URL || PLUGIN_FALLBACK).trim(),
};

