"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: number;
  productId: number;
  slug: string;
  title: string;
  variantLabel: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  maxQuantity: number | null;
};

type CartState = {
  lines: CartLine[];
  open: boolean;
  hydrated: boolean;
  add: (line: CartLine) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const MAX_PER_LINE = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      hydrated: false,
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          const cap = Math.min(MAX_PER_LINE, line.maxQuantity ?? MAX_PER_LINE);
          if (existing) {
            return {
              open: true,
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, ...line, quantity: Math.min(cap, l.quantity + line.quantity) } : l,
              ),
            };
          }
          return { open: true, lines: [...s.lines, { ...line, quantity: Math.min(cap, line.quantity) }] };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: s.lines
            .map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.max(0, Math.min(quantity, Math.min(MAX_PER_LINE, l.maxQuantity ?? MAX_PER_LINE))) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "loja-carrinho",
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines }),
      onRehydrateStorage: () => () => {
        useCart.setState({ hydrated: true });
      },
    },
  ),
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
