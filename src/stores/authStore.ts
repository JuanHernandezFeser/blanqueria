import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setToken } from '@/services/api';

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  phone?: string;
  address?: string;
  locality?: string;
  province?: string;
  postalCode?: string;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, extra?: { phone?: string; address?: string; locality?: string; province?: string; postalCode?: string }) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (email, password) => {
        try {
          const res = await api.login(email, password);
          setToken(res.token);
          set({ user: res.user });
          return true;
        } catch (e: any) {
          throw e;
        }
      },
  register: async (name, email, password, extra?) => {
    try {
      const res = await api.register(name, email, password, extra);
      setToken(res.token);
      set({ user: res.user });
      return true;
    } catch (e: any) {
      throw e;
    }
  },
      logout: () => {
        setToken(null);
        set({ user: null });
      },
      restoreSession: async () => {
        try {
          const user = await api.getMe();
          set({ user });
        } catch {
          setToken(null);
          set({ user: null });
        }
      },
    }),
    { name: 'auth-storage' }
  )
);
