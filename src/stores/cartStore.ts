import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

interface CartState {
  items: CartItem[];
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
      addItem: (product, variant) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id && i.variant === variant);
        if (existing) {
          set({ items: items.map((i) => i.product.id === product.id && i.variant === variant ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { product, quantity: 1, variant }] });
        }
      },
      removeItem: (productId, variant) => set({ items: get().items.filter((i) => !(i.product.id === productId && i.variant === variant)) }),
      updateQuantity: (productId, quantity, variant) => {
        const match = (i: CartItem) => i.product.id === productId && i.variant === variant;
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => !match(i)) });
        } else {
          set({ items: get().items.map((i) => match(i) ? { ...i, quantity } : i) });
        }
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
