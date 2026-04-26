import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Максимум единиц одной позиции в корзине (защита от случайного ввода). */
export const MAX_CART_LINE_QTY = 99;

export type CartLine = {
  productId: string;
  /** Нужны для POST /api/orders; старые записи в localStorage могут быть без полей — оформите заказ заново с карточки товара. */
  storeId?: string;
  variantId?: string;
  sku?: string;
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
        const qty = Math.min(MAX_CART_LINE_QTY, Math.max(1, line.qty ?? 1));
        const existing = get().lines.find((l) => l.productId === line.productId);
        if (existing) {
          const merged = Math.min(MAX_CART_LINE_QTY, existing.qty + qty);
          set({
            lines: get().lines.map((l) =>
              l.productId === line.productId ? { ...l, ...line, qty: merged } : l,
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
        const clamped = Math.min(MAX_CART_LINE_QTY, Math.max(1, Math.floor(qty)));
        set({
          lines: get().lines.map((l) => (l.productId === productId ? { ...l, qty: clamped } : l)),
        });
      },
      remove: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "nasibashop-cart" },
  ),
);
