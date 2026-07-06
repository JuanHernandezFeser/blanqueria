import { create } from 'zustand';
import type { Product } from '@/data/products';
import { getTotalStock } from '@/data/products';
import { api } from '@/services/api';

function sortByStock(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aInStock = getTotalStock(a) > 0;
    const bInStock = getTotalStock(b) > 0;
    return aInStock === bInStock ? 0 : aInStock ? -1 : 1;
  });
}

interface ProductState {
  products: Product[];
  loading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: true,
  fetchProducts: async () => {
    try {
      const products = await api.getProducts<Product[]>();
      set({ products: sortByStock(products), loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addProduct: async (product) => {
    const created = await api.createProduct(product);
    set({ products: sortByStock([created, ...get().products]) });
  },
  updateProduct: async (id, data) => {
    const updated = await api.updateProduct(id, data);
    set({ products: sortByStock(get().products.map((p) => (p.id === id ? { ...p, ...updated } : p))) });
  },
  deleteProduct: async (id) => {
    await api.deleteProduct(id);
    set({ products: get().products.filter((p) => p.id !== id) });
  },
}));
