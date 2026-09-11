import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShippingCalculator from '../components/ShippingCalculator';

vi.mock('@/services/shippingService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/shippingService')>();
  return {
    ...actual,
    quoteShipping: vi.fn().mockResolvedValue({
      method: 'Envío a domicilio (Correo Argentino)',
      days: 'A consultar',
      cost: 10489,
      source: 'correo_argentino_api',
    }),
  };
});

function UnstableParentHarness() {
  const [_, setCost] = useState(0);
  const [__, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const items = [{ product: { weight: 1.6, height: 8, width: 31, length: 51.97 }, quantity: 1 }];
  return (
    <div>
      <ShippingCalculator
        onShippingChange={setCost}
        onStatus={setStatus}
        cartItems={items}
        cartSubtotal={10000}
      />
    </div>
  );
}

describe('ShippingCalculator', () => {
  it('muestra el resultado y deja de mostrar "Calculando envío..." aunque el parent re-renderice con cartItems nuevo del carrito en cada render', async () => {
    render(<UnstableParentHarness />);
    fireEvent.change(screen.getByTestId('shipping-input'), { target: { value: '1000' } });

    expect(screen.getByText('Calculando envío...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('shipping-result')).toBeInTheDocument());
    expect(screen.queryByText('Calculando envío...')).not.toBeInTheDocument();
    expect(screen.getByTestId('shipping-result').textContent).toContain('Envío a domicilio');
  });
});