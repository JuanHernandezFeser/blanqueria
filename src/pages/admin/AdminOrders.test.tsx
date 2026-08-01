import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminOrders from './AdminOrders';

const { ordersState, confirmPayment, fetchOrders } = vi.hoisted(() => {
  const pendingOrder = {
    id: 'ORD-1', customerName: 'Juana', customerEmail: 'juana@test.com', date: '2026-07-01',
    subtotal: 1000, shippingCost: 0, total: 1000,
    orderStatus: 'Pendiente' as const, paymentMethod: 'transferencia' as const,
    paymentStatus: 'pendiente' as const, source: 'web' as const,
    items: [{ productId: 'p1', productName: 'Sábana Test', quantity: 1, price: 1000 }],
    shippingAddress: { address: 'Calle 1', city: 'CABA', province: 'CABA', postalCode: '1424', phone: '11-1111-1111' },
  };
  const approvedOrder = {
    ...pendingOrder,
    id: 'ORD-2',
    paymentStatus: 'aprobado' as const,
  };
  const ordersState = { orders: [pendingOrder, approvedOrder] };
  const confirmPayment = vi.fn().mockImplementation(async (id: string) => {
    ordersState.orders = ordersState.orders.map((o) => (o.id === id ? { ...o, paymentStatus: 'aprobado' } : o));
  });
  const fetchOrders = vi.fn();
  return { ordersState, confirmPayment, fetchOrders };
});

vi.mock('@/stores/orderStore', () => ({
  useOrderStore: (sel?: any) => {
    const state = { orders: ordersState.orders, loading: false, fetchOrders, updateStatus: vi.fn(), confirmPayment };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@/services/shippingService', () => ({
  formatPrice: (n: number) => `$${n}`,
  quoteShipping: vi.fn(),
}));

vi.mock('@/lib/helpers', () => ({
  formatDate: (d: string) => d,
}));

vi.mock('@/components/shared/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span>badge-{status}</span>,
}));

vi.mock('@/components/admin/ManualOrderForm', () => ({
  default: () => null,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function expandOrder(id: string) {
  fireEvent.click(screen.getByText(id));
}

describe('AdminOrders · Confirmar pago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ordersState.orders = [
      { ...ordersState.orders[0], paymentStatus: 'pendiente' },
      { ...ordersState.orders[1], paymentStatus: 'aprobado' },
    ];
  });

  it('muestra el botón "Confirmar pago" solo para órdenes con pago pendiente', () => {
    render(<AdminOrders />);

    expandOrder('ORD-2');
    expect(screen.queryByText('Confirmar pago')).not.toBeInTheDocument();

    expandOrder('ORD-1');
    const buttons = screen.getAllByText('Confirmar pago');
    expect(buttons.length).toBe(1);
    expect(buttons[0].closest('div')).toBeTruthy();
  });

  it('confirma el pago al hacer click y el botón desaparece', async () => {
    const { rerender } = render(<AdminOrders />);
    expandOrder('ORD-1');
    const button = screen.getByText('Confirmar pago');

    fireEvent.click(button);
    await waitFor(() => expect(confirmPayment).toHaveBeenCalledWith('ORD-1'));

    rerender(<AdminOrders />);

    expect(screen.queryByText('Confirmar pago')).not.toBeInTheDocument();
    expect(screen.getByText(/Aprobado/)).toBeInTheDocument();
  });
});
