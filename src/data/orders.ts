export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  orderStatus: 'Pendiente' | 'En preparación' | 'Enviado' | 'Entregado';
  paymentMethod: 'mercadopago' | 'transferencia';
  paymentStatus: 'pendiente' | 'aprobado' | 'rechazado';
  items: OrderItem[];
  shippingAddress: ShippingAddress;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-001', customerName: 'María García', customerEmail: 'maria@email.com',
    date: '2026-03-12', subtotal: 58700, shippingCost: 850, total: 59550,
    orderStatus: 'Pendiente', paymentMethod: 'transferencia', paymentStatus: 'pendiente',
    shippingAddress: { address: 'Av. Siempre Viva 123', city: 'CABA', province: 'CABA', postalCode: '1424', phone: '11-1234-5678' },
    items: [{ productId: '1', productName: 'Sábanas de Algodón Egipcio 400 Hilos', quantity: 1, price: 45900 }, { productId: '5', productName: 'Toallón de Algodón Peinado 600g', quantity: 1, price: 12800 }],
  },
  {
    id: 'ORD-002', customerName: 'Carlos López', customerEmail: 'carlos@email.com',
    date: '2026-03-10', subtotal: 89000, shippingCost: 1200, total: 90200,
    orderStatus: 'En preparación', paymentMethod: 'mercadopago', paymentStatus: 'aprobado',
    shippingAddress: { address: 'Calle Falsa 456', city: 'La Plata', province: 'Buenos Aires', postalCode: '1900', phone: '11-9876-5432' },
    items: [{ productId: '13', productName: 'Acolchado de Duvet Premium', quantity: 1, price: 89000 }],
  },
  {
    id: 'ORD-003', customerName: 'Ana Rodríguez', customerEmail: 'ana@email.com',
    date: '2026-03-08', subtotal: 47300, shippingCost: 1400, total: 48700,
    orderStatus: 'Enviado', paymentMethod: 'mercadopago', paymentStatus: 'aprobado',
    shippingAddress: { address: 'Belgrano 789', city: 'Rosario', province: 'Santa Fe', postalCode: '2000', phone: '341-123456' },
    items: [{ productId: '9', productName: 'Almohada de Pluma de Ganso', quantity: 1, price: 19500 }, { productId: '17', productName: 'Mantel de Lino Natural', quantity: 1, price: 28500 }],
  },
  {
    id: 'ORD-004', customerName: 'Laura Martínez', customerEmail: 'laura@email.com',
    date: '2026-03-05', subtotal: 32500, shippingCost: 0, total: 32500,
    orderStatus: 'Entregado', paymentMethod: 'transferencia', paymentStatus: 'aprobado',
    shippingAddress: { address: 'San Martín 321', city: 'Córdoba', province: 'Córdoba', postalCode: '5000', phone: '351-987654' },
    items: [{ productId: '2', productName: 'Sábanas de Percal Suave', quantity: 1, price: 32500 }],
  },
  {
    id: 'ORD-005', customerName: 'Diego Fernández', customerEmail: 'diego@email.com',
    date: '2026-03-01', subtotal: 22500, shippingCost: 1400, total: 23900,
    orderStatus: 'Entregado', paymentMethod: 'mercadopago', paymentStatus: 'aprobado',
    shippingAddress: { address: 'Mitre 654', city: 'Mendoza', province: 'Mendoza', postalCode: '5500', phone: '261-456789' },
    items: [{ productId: '6', productName: 'Set de Toallas Spa x3', quantity: 1, price: 22500 }],
  },
];
