export interface ShippingOverride {
  service: string;
  price: number;
  etaMinDays: number;
  etaMaxDays: number;
  freeShippingThreshold?: number;
}

// Tarifas de envío fijas por código postal (match exacto), con prioridad absoluta
// sobre la API de MiCorreo y sobre el cálculo fallback.
// freeShippingThreshold: si el subtotal bruto del carrito es >= este valor, price pasa a 0.
export const SHIPPING_OVERRIDES: Record<string, ShippingOverride> = {
  '8000': { service: 'Envío personal', price: 5000, etaMinDays: 2, etaMaxDays: 2, freeShippingThreshold: 60000 },
  '8103': { service: 'Envío personal', price: 5000, etaMinDays: 2, etaMaxDays: 2, freeShippingThreshold: 60000 },
  '8118': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
  '8105': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
  '8109': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
  '8168': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
  '8163': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
  '8166': { service: 'Envío personal', price: 10000, etaMinDays: 2, etaMaxDays: 2 },
};
