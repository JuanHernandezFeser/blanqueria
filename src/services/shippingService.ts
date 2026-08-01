export interface ShippingResult {
  method: string;
  days: string;
  cost: number;
  source: 'correo_argentino_api' | 'fallback' | 'manual_override';
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

const DEFAULT_PACKAGE: Omit<ShipmentPackage, 'quantity'> = {
  weight: 1,
  width: 20,
  height: 20,
  length: 20,
};

export function buildShipmentPackages(cartItems: CartItemInput[]): ShipmentPackage[] {
  return cartItems.map((item) => ({
    weight: item.product.weight || DEFAULT_PACKAGE.weight,
    height: item.product.height || DEFAULT_PACKAGE.height,
    width: item.product.width || DEFAULT_PACKAGE.width,
    length: item.product.length || DEFAULT_PACKAGE.length,
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
  try {
    const res = await fetch(`${API_BASE}/api/shipping/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postalCode, packages, cartSubtotal }),
    });
    if (!res.ok) throw new Error(`Shipping API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[shipping] API call failed, using fallback:', err);
    return calculateShippingFallback(postalCode);
  }
}

export const calculateShipping = (postalCode: string): ShippingResult | null => {
  if (!postalCode || postalCode.length < 4) return null;
  return calculateShippingFallback(postalCode);
};

function calculateShippingFallback(postalCode: string): ShippingResult {
  const isCABA = postalCode.startsWith('1');
  const isGBA = postalCode.startsWith('16') || postalCode.startsWith('17') || postalCode.startsWith('18') || postalCode.startsWith('19');

  if (isCABA) {
    return { method: 'Envío Express', days: '24-48hs', cost: 850, source: 'fallback' };
  }
  if (isGBA) {
    return { method: 'Envío Estándar', days: '2-3 días hábiles', cost: 1200, source: 'fallback' };
  }
  return { method: 'Correo Argentino', days: '3-5 días hábiles', cost: 1400, source: 'fallback' };
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};
