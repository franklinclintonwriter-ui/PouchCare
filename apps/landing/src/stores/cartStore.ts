import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  serviceId: string;
  name: string;
  slug: string;
  unitPriceUsd: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQty: (serviceId: string, quantity: number) => void;
  remove: (serviceId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) => {
        const q = line.quantity ?? 1;
        const existing = get().lines.find((l) => l.serviceId === line.serviceId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.serviceId === line.serviceId
                ? { ...l, quantity: l.quantity + q }
                : l,
            ),
          });
        } else {
          set({ lines: [...get().lines, { ...line, quantity: q }] });
        }
      },
      updateQty: (serviceId, quantity) => {
        if (quantity < 1) {
          set({
            lines: get().lines.filter((l) => l.serviceId !== serviceId),
          });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.serviceId === serviceId ? { ...l, quantity } : l,
          ),
        });
      },
      remove: (serviceId) =>
        set({ lines: get().lines.filter((l) => l.serviceId !== serviceId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "pouchcare-portal-cart", version: 1 },
  ),
);
