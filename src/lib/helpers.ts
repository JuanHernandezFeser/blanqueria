export function statusColor(status: string): string {
  switch (status) {
    case 'Entregado': return 'bg-green-100 text-green-800';
    case 'Enviado': return 'bg-blue-100 text-blue-800';
    case 'En preparación': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-secondary text-foreground';
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function reduceStock(
  items: { product: { id: string; stock: number; variantStock?: Record<string, number> }; variant?: string; quantity: number }[],
  updateProduct: (id: string, data: any) => void,
) {
  items.forEach((item) => {
    const p = item.product;
    if (p.variantStock && item.variant) {
      const key = item.variant;
      const current = p.variantStock[key] ?? 0;
      updateProduct(p.id, {
        variantStock: { ...p.variantStock, [key]: Math.max(0, current - item.quantity) },
      });
    } else {
      updateProduct(p.id, { stock: Math.max(0, p.stock - item.quantity) });
    }
  });
}

export const provinces = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];
