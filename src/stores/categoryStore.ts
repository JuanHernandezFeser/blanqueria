import { create } from 'zustand';
import { api } from '@/services/api';

export interface CategoryItem {
  name: string;
  image: string;
  description: string;
  subcategories: string[];
}

export type CategoryInput = Omit<CategoryItem, 'image'> & { image?: string };

interface CategoryState {
  categories: CategoryItem[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: CategoryInput) => Promise<void>;
  updateCategory: (oldName: string, cat: Partial<CategoryItem>) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addSubcategory: (categoryName: string, subcategory: string) => Promise<void>;
  removeSubcategory: (categoryName: string, subcategory: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: true,
  fetchCategories: async () => {
    try {
      const categories = await api.getCategories<CategoryItem[]>();
      set({ categories, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addCategory: async (cat) => {
    const created = await api.createCategory(cat);
    set({ categories: [...get().categories, created] });
  },
  updateCategory: async (oldName, data) => {
    const updated = await api.updateCategory(oldName, data);
    set({ categories: get().categories.map((c) => (c.name === (data.name || oldName) ? updated : c)) });
  },
  deleteCategory: async (name) => {
    await api.deleteCategory(name);
    set({ categories: get().categories.filter((c) => c.name !== name) });
  },
  addSubcategory: async (categoryName, subcategory) => {
    const cat = get().categories.find((c) => c.name === categoryName);
    if (!cat || cat.subcategories.includes(subcategory)) return;
    const updated = await api.updateCategory(categoryName, { subcategories: [...cat.subcategories, subcategory] });
    set({ categories: get().categories.map((c) => (c.name === categoryName ? updated : c)) });
  },
  removeSubcategory: async (categoryName, subcategory) => {
    const cat = get().categories.find((c) => c.name === categoryName);
    if (!cat) return;
    const updated = await api.updateCategory(categoryName, { subcategories: cat.subcategories.filter((s) => s !== subcategory) });
    set({ categories: get().categories.map((c) => (c.name === categoryName ? updated : c)) });
  },
}));
