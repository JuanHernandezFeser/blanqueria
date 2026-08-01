import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Checkout from './Checkout';

const { clearCart, fetchProducts, addOrder, createOrder, cartState, testUser } = vi.hoisted(() => {
  const clearCart = vi.fn();
  const fetchProducts = vi.fn();
  const addOrder = vi.fn();
  const createOrder = vi.fn().mockResolvedValue({ id: 'ORD-1' });
  const cartState = {
    items: [{ product: { id: 'p1', name: 'Sábana Test', price: 1000, image: '/x.jpg' }, quantity: 1, variant: undefined }],
    subtotal: () => 1000,
    clearCart,
  };
  const testUser = { email: 'user@test.com', name: 'Test User', isAdmin: false };
  return { clearCart, fetchProducts, addOrder, createOrder, cartState, testUser };
});

vi.mock('@/stores/cartStore', () => ({
  useCartStore: (sel?: any) => (sel ? sel(cartState) : cartState),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel?: any) => {
    const state = { user: testUser };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@/stores/productStore', () => ({
  useProductStore: (sel?: any) => (sel ? sel({ fetchProducts }) : { fetchProducts }),
}));

vi.mock('@/stores/orderStore', () => ({
  useOrderStore: (sel?: any) => (sel ? sel({ addOrder }) : { addOrder }),
}));

vi.mock('@/stores/bankConfigStore', () => ({
  useBankConfigStore: (sel?: any) => {
    const state = { config: { bankName: 'Banco Test', cbu: '0000', alias: 'TEST', accountHolder: 'Test SA', discountPercentage: 10 } };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@/services/api', () => ({
  api: {
    createOrder,
    createMpPreference: vi.fn(),
    getBankConfig: vi.fn(),
  },
  setToken: vi.fn(),
  getToken: vi.fn(),
}));

vi.mock('@/services/shippingService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/shippingService')>();
  return {
    ...actual,
    quoteShipping: vi.fn().mockResolvedValue({
      method: 'Envío personal', days: '2 días hábiles', cost: 1000, source: 'manual_override',
    }),
  };
});

vi.mock('@/components/ShippingCalculator', async () => {
  const React = await import('react');
  const personal = { method: 'Envío personal', days: '2 días hábiles', cost: 5000, source: 'manual_override' as const };
  const fallback = { method: 'Envío Express', days: '24-48hs', cost: 850, source: 'fallback' as const };
  return {
    default: (props: any) =>
      React.createElement('div', null,
        React.createElement('button', { type: 'button', 'data-testid': 'quote-personal', onClick: () => props.onQuoteResult?.(personal) }, 'Personal'),
        React.createElement('button', { type: 'button', 'data-testid': 'quote-fallback', onClick: () => props.onQuoteResult?.(fallback) }, 'Fallback'),
      ),
  };
});

vi.mock('react-router-dom', async () => {
  const React = await import('react');
  return {
    useNavigate: () => () => {},
    Link: ({ children, ...props }: any) => React.createElement('a', props, children),
  };
});

function fillShippingForm() {
  fireEvent.change(screen.getByTestId('checkout-name'), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByTestId('checkout-address'), { target: { value: 'Calle 1' } });
  fireEvent.change(screen.getByTestId('checkout-city'), { target: { value: 'Bahía Blanca' } });
  fireEvent.change(screen.getByTestId('checkout-province'), { target: { value: 'Buenos Aires' } });
  fireEvent.change(screen.getByTestId('checkout-postal'), { target: { value: '8000' } });
  fireEvent.change(screen.getByTestId('checkout-phone'), { target: { value: '123456' } });
}

describe('Checkout pago en efectivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOrder.mockResolvedValue({ id: 'ORD-1' });
  });

  it('muestra el botón Efectivo cuando la cotización es entrega personal', () => {
    render(<Checkout />);
    fireEvent.click(screen.getByTestId('quote-personal'));
    fillShippingForm();
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    expect(screen.getByTestId('payment-efectivo')).toBeInTheDocument();
  });

  it('no muestra Efectivo con CP sin entrega personal y resetea la selección al cambiar el CP', () => {
    render(<Checkout />);
    fireEvent.click(screen.getByTestId('quote-fallback'));
    fillShippingForm();
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    expect(screen.queryByTestId('payment-efectivo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Volver'));
    fireEvent.click(screen.getByTestId('quote-personal'));
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    fireEvent.click(screen.getByTestId('payment-efectivo'));
    fireEvent.click(screen.getByTestId('continue-to-confirm'));
    expect(screen.queryByTestId('continue-to-confirm')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cambiar método de pago'));
    fireEvent.click(screen.getByText('Volver'));
    fireEvent.click(screen.getByTestId('quote-fallback'));
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    expect(screen.queryByTestId('payment-efectivo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('continue-to-confirm'));
    expect(screen.getByTestId('continue-to-confirm')).toBeInTheDocument();
  });

  it('crea la orden en efectivo con descuento y pendiente', async () => {
    render(<Checkout />);
    fireEvent.click(screen.getByTestId('quote-personal'));
    fillShippingForm();
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    fireEvent.click(screen.getByTestId('payment-efectivo'));
    fireEvent.click(screen.getByTestId('continue-to-confirm'));
    fireEvent.click(screen.getByTestId('confirm-order'));

    await waitFor(() => expect(createOrder).toHaveBeenCalled());
    const payload = createOrder.mock.calls[0][0];
    expect(payload.paymentMethod).toBe('efectivo');
    expect(payload.paymentStatus).toBe('pendiente');
    expect(payload.subtotal).toBe(900);
  });

  it('muestra el error de la API cuando rechaza efectivo con CP sin override y no completa la orden', async () => {
    createOrder.mockRejectedValueOnce(new Error('El pago en efectivo solo está disponible en códigos postales con entrega personal'));
    render(<Checkout />);
    fireEvent.click(screen.getByTestId('quote-personal'));
    fillShippingForm();
    fireEvent.click(screen.getByTestId('continue-to-payment'));
    fireEvent.click(screen.getByTestId('payment-efectivo'));
    fireEvent.click(screen.getByTestId('continue-to-confirm'));
    fireEvent.click(screen.getByTestId('confirm-order'));

    await waitFor(() => expect(createOrder).toHaveBeenCalled());
    const payload = createOrder.mock.calls[0][0];
    expect(payload.paymentMethod).toBe('efectivo');
    expect(screen.queryByTestId('order-id')).not.toBeInTheDocument();
    expect(screen.getByTestId('confirm-order')).toBeInTheDocument();
    expect(clearCart).not.toHaveBeenCalled();
  });
});
