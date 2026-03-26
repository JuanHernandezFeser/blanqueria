import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CategoryItem {
  name: string;
  image: string;
  description: string;
  subcategories: string[];
}

const defaultCategories: CategoryItem[] = [
  { name: 'Sábanas', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop', description: 'Algodón premium para tu descanso', subcategories: [] },
  { name: 'Toallas', image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&h=750&fit=crop', description: 'Suavidad en cada detalle', subcategories: [] },
  { name: 'Almohadas', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=750&fit=crop', description: 'El soporte perfecto', subcategories: [] },
  { name: 'Acolchados', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', description: 'Calidez y estilo', subcategories: [] },
  { name: 'Manteles', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop', description: 'Elegancia en tu mesa', subcategories: [] },
];

interface CategoryState {
  categories: CategoryItem[];
  addCategory: (cat: CategoryItem) => void;
  updateCategory: (oldName: string, cat: Partial<CategoryItem>) => void;
  deleteCategory: (name: string) => void;
  addSubcategory: (categoryName: string, subcategory: string) => void;
  removeSubcategory: (categoryName: string, subcategory: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      addCategory: (cat) => {
        if (get().categories.some((c) => c.name === cat.name)) return;
        set({ categories: [...get().categories, { ...cat, subcategories: cat.subcategories || [] }] });
      },
      updateCategory: (oldName, data) => {
        set({
          categories: get().categories.map((c) =>
            c.name === oldName ? { ...c, ...data } : c
          ),
        });
      },
      deleteCategory: (name) => {
        set({ categories: get().categories.filter((c) => c.name !== name) });
      },
      addSubcategory: (categoryName, subcategory) => {
        set({
          categories: get().categories.map((c) =>
            c.name === categoryName && !c.subcategories.includes(subcategory)
              ? { ...c, subcategories: [...c.subcategories, subcategory] }
              : c
          ),
        });
      },
      removeSubcategory: (categoryName, subcategory) => {
        set({
          categories: get().categories.map((c) =>
            c.name === categoryName
              ? { ...c, subcategories: c.subcategories.filter((s) => s !== subcategory) }
              : c
          ),
        });
      },
    }),
    { name: 'category-storage' }
  )
);
