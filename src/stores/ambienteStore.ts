import { create } from 'zustand';
import { api } from '@/services/api';

export interface AmbienteItem {
  name: string;
  image: string;
  description: string;
}

export type AmbienteInput = Omit<AmbienteItem, 'image'> & { image?: string };

interface AmbienteState {
  ambientes: AmbienteItem[];
  loading: boolean;
  fetchAmbientes: () => Promise<void>;
  addAmbiente: (ambiente: AmbienteInput) => Promise<void>;
  updateAmbiente: (oldName: string, data: Partial<AmbienteItem>) => Promise<void>;
  deleteAmbiente: (name: string) => Promise<void>;
}

export const useAmbienteStore = create<AmbienteState>((set, get) => ({
  ambientes: [],
  loading: true,
  fetchAmbientes: async () => {
    try {
      const ambientes = await api.getAmbientes<AmbienteItem[]>();
      set({ ambientes, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addAmbiente: async (ambiente) => {
    const created = await api.createAmbiente(ambiente);
    set({ ambientes: [...get().ambientes, created] });
  },
  updateAmbiente: async (oldName, data) => {
    const updated = await api.updateAmbiente(oldName, data);
    set({ ambientes: get().ambientes.map((a) => (a.name === (data.name || oldName) ? updated : a)) });
  },
  deleteAmbiente: async (name) => {
    await api.deleteAmbiente(name);
    set({ ambientes: get().ambientes.filter((a) => a.name !== name) });
  },
}));
