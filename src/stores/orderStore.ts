import { create } from 'zustand';
import type { Order } from '@/data/orders';
import { api } from '@/services/api';

interface OrderState {
  orders: Order[];
  loading: boolean;
  fetchOrders: (email?: string) => Promise<void>;
  addOrder: (order: Order) => void;
  updateStatus: (id: string, status: Order['orderStatus']) => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  (set, get) => ({
    orders: [],
    loading: false,
    fetchOrders: async (email) => {
      set({ loading: true });
      try {
        const orders = await api.getOrders<Order[]>(email);
        orders.sort((a, b) => b.date.localeCompare(a.date));
        set({ orders, loading: false });
      } catch {
        set({ loading: false });
      }
    },
    addOrder: (order) => {
      const updated = [order, ...get().orders];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      set({ orders: updated });
    },
    updateStatus: async (id, orderStatus) => {
      await api.updateOrderStatus(id, orderStatus);
      set({ orders: get().orders.map((o) => (o.id === id ? { ...o, orderStatus } : o)) });
    },
  })
);
