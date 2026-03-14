import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const mockUsers: { email: string; password: string; name: string; isAdmin: boolean }[] = [
  { email: 'user@tienda.com', password: 'user123', name: 'Usuario Demo', isAdmin: false },
  { email: 'admin@tienda.com', password: 'admin123', name: 'Administrador', isAdmin: true },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const found = mockUsers.find((u) => u.email === email && u.password === password);
        if (found) {
          set({ user: { email: found.email, name: found.name, isAdmin: found.isAdmin } });
          return true;
        }
        // Allow any valid email/password combo as regular user
        if (email.includes('@') && password.length >= 4) {
          set({ user: { email, name: email.split('@')[0], isAdmin: false } });
          return true;
        }
        return false;
      },
      register: (name, email, password) => {
        if (email.includes('@') && password.length >= 4 && name.length > 0) {
          mockUsers.push({ email, password, name, isAdmin: false });
          set({ user: { email, name, isAdmin: false } });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),
    }),
    { name: 'auth-storage' }
  )
);
