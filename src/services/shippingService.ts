export interface ShippingResult {
  method: string;
  days: string;
  cost: number;
}

export const calculateShipping = (postalCode: string): ShippingResult | null => {
  if (!postalCode || postalCode.length < 4) return null;

  const isCABA = postalCode.startsWith('1');
  const isGBA = postalCode.startsWith('16') || postalCode.startsWith('17') || postalCode.startsWith('18') || postalCode.startsWith('19');

  if (isCABA) {
    return { method: 'Envío Express', days: '24-48hs', cost: 850 };
  }
  if (isGBA) {
    return { method: 'Envío Estándar', days: '2-3 días hábiles', cost: 1200 };
  }
  return { method: 'Correo Argentino', days: '3-5 días hábiles', cost: 1400 };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
};

export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
};
