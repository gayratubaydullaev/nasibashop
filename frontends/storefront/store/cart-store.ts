import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  titleUz: string;
  priceUnits: number;
  discountPercent: number;
  imageUrl?: string;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) => {
        const qty = line.qty ?? 1;
        const existing = get().lines.find((l) => l.productId === line.productId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.productId === line.productId ? { ...l, qty: l.qty + qty } : l,
            ),
          });
        } else {
          set({ lines: [...get().lines, { ...line, qty }] });
        }
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) });
          return;
        }
        set({
          lines: get().lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        });
      },
      remove: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "nasibashop-cart" },
  ),
);
