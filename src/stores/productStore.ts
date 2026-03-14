import { create } from 'zustand';
import { initialProducts, type Product } from '@/data/products';

interface ProductState {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  addProduct: (product) => {
    const id = String(Date.now());
    set({ products: [...get().products, { ...product, id }] });
  },
  updateProduct: (id, data) => {
    set({ products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)) });
  },
  deleteProduct: (id) => {
    set({ products: get().products.filter((p) => p.id !== id) });
  },
}));
