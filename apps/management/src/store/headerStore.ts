import { create } from "zustand";
import type { HeaderConfig } from "@/types/header";

interface HeaderState {
  title: string;
  actions: NonNullable<HeaderConfig["actions"]>;
  setHeader: (config: HeaderConfig) => void;
  clearHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: "",
  actions: [],

  setHeader: (config) =>
    set({
      title: config.title ?? "",
      actions: config.actions ?? [],
    }),

  clearHeader: () =>
    set({
      title: "",
      actions: [],
    }),
}));
