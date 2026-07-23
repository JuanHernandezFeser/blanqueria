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
  emailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  updateProfile: (data: { name: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: async (email, password) => {
        const res = await api.login(email, password);
        setToken(res.token);
        set({ user: res.user });
        return true;
      },
      register: async (email, password) => {
        const res = await api.register(email, password);
        setToken(res.token);
        set({ user: res.user });
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
      updateProfile: async (data) => {
        await api.updateProfile(data);
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },
    }),
    { name: 'auth-storage' }
  )
);
