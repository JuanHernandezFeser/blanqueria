import { create } from 'zustand';
import { api } from '@/services/api';

export interface BankConfig {
  bankName: string;
  cbu: string;
  alias: string;
  accountHolder: string;
  discountPercentage: number;
}

interface BankConfigState {
  config: BankConfig;
  loading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: BankConfig) => Promise<void>;
}

export const useBankConfigStore = create<BankConfigState>((set, get) => ({
  config: { bankName: '', cbu: '', alias: '', accountHolder: '', discountPercentage: 0 },
  loading: true,
  fetchConfig: async () => {
    try {
      const config = await api.getBankConfig<BankConfig>();
      set({ config, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  updateConfig: async (config) => {
    const updated = await api.updateBankConfig<BankConfig>(config);
    set({ config: updated });
  },
}));
