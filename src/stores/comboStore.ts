import { create } from 'zustand';
import { api } from '@/services/api';

export interface ComboItemRef {
  id: string;
  comboId: string;
  productId: string;
  productName: string;
  variant?: string;
  color?: string;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  slug?: string;
  active: boolean;
  comboItems: ComboItemRef[];
  stock: number;
  weight?: number;
}

export interface ComboComponentInput {
  productId: string;
  variant?: string;
  color?: string;
  quantity: number;
}

export interface ComboInput {
  name: string;
  description?: string;
  price: number;
  image?: string;
  slug?: string;
  comboItems: ComboComponentInput[];
}

interface ComboState {
  combos: Combo[];
  loading: boolean;
  fetchCombos: () => Promise<void>;
  addCombo: (data: ComboInput) => Promise<void>;
  updateCombo: (id: string, data: ComboInput & { active?: boolean }) => Promise<void>;
  deleteCombo: (id: string) => Promise<void>;
}

export const useComboStore = create<ComboState>((set, get) => ({
  combos: [],
  loading: true,
  fetchCombos: async () => {
    try {
      const combos = await api.getCombos<Combo[]>();
      set({ combos, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addCombo: async (data) => {
    const created = await api.createCombo<Combo>(data);
    set({ combos: [created, ...get().combos] });
  },
  updateCombo: async (id, data) => {
    const updated = await api.updateCombo<Combo>(id, data);
    set({ combos: get().combos.map((c) => (c.id === id ? updated : c)) });
  },
  deleteCombo: async (id) => {
    await api.deleteCombo(id);
    set({ combos: get().combos.filter((c) => c.id !== id) });
  },
}));