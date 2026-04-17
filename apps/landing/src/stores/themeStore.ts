import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor =
  | "blue"
  | "indigo"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "sky";

type RGB = string; // "R G B" space-separated for Tailwind's <alpha-value> syntax

interface AccentPalette {
  50: RGB;
  100: RGB;
  200: RGB;
  300: RGB;
  400: RGB;
  500: RGB;
  600: RGB;
  700: RGB;
  800: RGB;
  900: RGB;
  950: RGB;
}

const ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
  blue: {
    50: "239 246 255",
    100: "219 234 254",
    200: "191 219 254",
    300: "147 197 253",
    400: "96 165 250",
    500: "59 130 246",
    600: "37 99 235",
    700: "29 78 216",
    800: "30 64 175",
    900: "30 58 138",
    950: "23 37 84",
  },
  indigo: {
    50: "238 242 255",
    100: "224 231 255",
    200: "199 210 254",
    300: "165 180 252",
    400: "129 140 248",
    500: "99 102 241",
    600: "79 70 229",
    700: "67 56 202",
    800: "55 48 163",
    900: "49 46 129",
    950: "30 27 75",
  },
  violet: {
    50: "245 243 255",
    100: "237 233 254",
    200: "221 214 254",
    300: "196 181 253",
    400: "167 139 250",
    500: "139 92 246",
    600: "124 58 237",
    700: "109 40 217",
    800: "91 33 182",
    900: "76 29 149",
    950: "46 16 101",
  },
  emerald: {
    50: "236 253 245",
    100: "209 250 229",
    200: "167 243 208",
    300: "110 231 183",
    400: "52 211 153",
    500: "16 185 129",
    600: "5 150 105",
    700: "4 120 87",
    800: "6 95 70",
    900: "6 78 59",
    950: "2 44 34",
  },
  rose: {
    50: "255 241 242",
    100: "255 228 230",
    200: "254 205 211",
    300: "253 164 175",
    400: "251 113 133",
    500: "244 63 94",
    600: "225 29 72",
    700: "190 18 60",
    800: "159 18 57",
    900: "136 19 55",
    950: "76 5 25",
  },
  amber: {
    50: "255 251 235",
    100: "254 243 199",
    200: "253 230 138",
    300: "252 211 77",
    400: "251 191 36",
    500: "245 158 11",
    600: "217 119 6",
    700: "180 83 9",
    800: "146 64 14",
    900: "120 53 15",
    950: "69 26 3",
  },
  sky: {
    50: "240 249 255",
    100: "224 242 254",
    200: "186 230 253",
    300: "125 211 252",
    400: "56 189 248",
    500: "14 165 233",
    600: "2 132 199",
    700: "3 105 161",
    800: "7 89 133",
    900: "12 74 110",
    950: "8 47 73",
  },
};

export const ACCENT_OPTIONS: { value: AccentColor; label: string; hex: string }[] = [
  { value: "blue", label: "Blue", hex: "#3b82f6" },
  { value: "indigo", label: "Indigo", hex: "#6366f1" },
  { value: "violet", label: "Violet", hex: "#8b5cf6" },
  { value: "emerald", label: "Emerald", hex: "#10b981" },
  { value: "rose", label: "Rose", hex: "#f43f5e" },
  { value: "amber", label: "Amber", hex: "#f59e0b" },
  { value: "sky", label: "Sky", hex: "#0ea5e9" },
];

function getResolvedMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyToDOM(mode: ThemeMode, accent: AccentColor) {
  if (typeof document === "undefined") return;

  const resolved = getResolvedMode(mode);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");

  const palette = ACCENT_PALETTES[accent];
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
  for (const shade of shades) {
    root.style.setProperty(`--color-primary-${shade}`, palette[shade]);
  }
}

interface ThemeState {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      accent: "blue",

      setMode: (mode) => {
        set({ mode });
        applyToDOM(mode, get().accent);
      },

      setAccent: (accent) => {
        set({ accent });
        applyToDOM(get().mode, accent);
      },

      applyTheme: () => {
        const { mode, accent } = get();
        applyToDOM(mode, accent);
      },
    }),
    {
      name: "pouchcare-theme",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) applyToDOM(state.mode, state.accent);
      },
    },
  ),
);

if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const { mode, accent } = useThemeStore.getState();
      if (mode === "system") applyToDOM(mode, accent);
    });
}
