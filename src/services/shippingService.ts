export interface ShippingResult {
  method: string;
  days: string;
  cost: number;
  source: 'correo_argentino_api' | 'manual_override';
}

export interface ShipmentPackage {
  weight: number;
  height: number;
  width: number;
  length: number;
  quantity: number;
}

export interface CartItemInput {
  product: { weight?: number; width?: number; height?: number; length?: number };
  quantity: number;
}

export function buildShipmentPackages(cartItems: CartItemInput[]): ShipmentPackage[] {
  return cartItems.map((item) => ({
    weight: item.product.weight || 1,
    height: item.product.height || 20,
    width: item.product.width || 20,
    length: item.product.length || 20,
    quantity: item.quantity,
  }));
}

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

export async function quoteShipping(
  postalCode: string,
  cartItems: CartItemInput[],
  cartSubtotal = 0
): Promise<ShippingResult> {
  const packages = buildShipmentPackages(cartItems);
  const res = await fetch(`${API_BASE}/api/shipping/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postalCode, packages, cartSubtotal }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Error al calcular envío (${res.status})`);
  }
  return await res.json();
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};
