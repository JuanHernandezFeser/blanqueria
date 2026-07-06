import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/data/products';

const CART_TTL = 72 * 60 * 60 * 1000;

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

interface CartState {
  items: CartItem[];
  _updatedAt: number;
  addItem: (product: Product, variant?: string) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _updatedAt: 0,
      addItem: (product, variant) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id && i.variant === variant);
        if (existing) {
          set({ items: items.map((i) => i.product.id === product.id && i.variant === variant ? { ...i, quantity: i.quantity + 1 } : i), _updatedAt: Date.now() });
        } else {
          set({ items: [...items, { product, quantity: 1, variant }], _updatedAt: Date.now() });
        }
      },
      removeItem: (productId, variant) => set({ items: get().items.filter((i) => !(i.product.id === productId && i.variant === variant)), _updatedAt: Date.now() }),
      updateQuantity: (productId, quantity, variant) => {
        const match = (i: CartItem) => i.product.id === productId && i.variant === variant;
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => !match(i)), _updatedAt: Date.now() });
        } else {
          set({ items: get().items.map((i) => match(i) ? { ...i, quantity } : i), _updatedAt: Date.now() });
        }
      },
      clearCart: () => set({ items: [], _updatedAt: Date.now() }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<CartState>) };
        if (merged._updatedAt && Date.now() - merged._updatedAt > CART_TTL) {
          return { ...merged, items: [], _updatedAt: Date.now() };
        }
        return merged;
      },
    }
  )
);
