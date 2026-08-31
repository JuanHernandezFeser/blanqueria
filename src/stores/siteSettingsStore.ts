import { create } from 'zustand';
import { api } from '@/services/api';

interface SiteSettingsState {
  settings: Record<string, string>;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  getMaxPriceFilter: () => number;
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  settings: {},
  loading: true,
  fetchSettings: async () => {
    try {
      const settings = await api.getSiteSettings<Record<string, string>>();
      set({ settings, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  updateSetting: async (key, value) => {
    await api.updateSiteSetting(key, value);
    set((state) => ({ settings: { ...state.settings, [key]: value } }));
  },
  getMaxPriceFilter: () => {
    const val = get().settings['max_price_filter'];
    return val ? parseInt(val, 10) : 100000;
  },
}));
