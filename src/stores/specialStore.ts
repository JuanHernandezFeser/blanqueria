import { create } from 'zustand';
import type { Special } from '@/data/specials';
import { api } from '@/services/api';

interface SpecialState {
  specials: Special[];
  loading: boolean;
  fetchSpecials: () => Promise<void>;
  addSpecial: (data: { title: string; productIds: string[] }) => Promise<void>;
  updateSpecial: (id: string, data: { title?: string; productIds?: string[]; active?: boolean }) => Promise<void>;
  deleteSpecial: (id: string) => Promise<void>;
}

export const useSpecialStore = create<SpecialState>((set, get) => ({
  specials: [],
  loading: true,
  fetchSpecials: async () => {
    try {
      const specials = await api.getSpecials<Special[]>();
      set({ specials, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addSpecial: async (data) => {
    const created = await api.createSpecial<Special>(data);
    set({ specials: [created, ...get().specials] });
  },
  updateSpecial: async (id, data) => {
    const updated = await api.updateSpecial<Special>(id, data);
    const specials = get().specials.map((s) => (s.id === id ? updated : s));
    if (updated.active) {
      set({ specials: specials.map((s) => (s.id === id ? s : { ...s, active: false })) });
    } else {
      set({ specials });
    }
  },
  deleteSpecial: async (id) => {
    await api.deleteSpecial(id);
    set({ specials: get().specials.filter((s) => s.id !== id) });
  },
}));
