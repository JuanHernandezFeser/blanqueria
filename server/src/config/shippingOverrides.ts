export interface ShippingOverride {
  service: string;
  price: number;
  etaMinDays: number;
  etaMaxDays: number;
  freeShippingThreshold?: number;
}

// Duplicado de workers/api/src/config/shippingOverrides.ts para mantener paridad
// en el backend local de Bun (server/ y workers/api/ son proyectos separados).
// Mantener sincronizado al agregar CPs con tarifa fija.
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
