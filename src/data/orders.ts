export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: 'Pendiente' | 'En preparación' | 'Enviado' | 'Entregado';
  items: { productId: string; productName: string; quantity: number; price: number }[];
}

export const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'María García', customerEmail: 'maria@email.com', date: '2026-03-12', total: 58700, status: 'Pendiente', items: [{ productId: '1', productName: 'Sábanas de Algodón Egipcio 400 Hilos', quantity: 1, price: 45900 }, { productId: '5', productName: 'Toallón de Algodón Peinado 600g', quantity: 1, price: 12800 }] },
  { id: 'ORD-002', customerName: 'Carlos López', customerEmail: 'carlos@email.com', date: '2026-03-10', total: 89000, status: 'En preparación', items: [{ productId: '13', productName: 'Acolchado de Duvet Premium', quantity: 1, price: 89000 }] },
  { id: 'ORD-003', customerName: 'Ana Rodríguez', customerEmail: 'ana@email.com', date: '2026-03-08', total: 47300, status: 'Enviado', items: [{ productId: '9', productName: 'Almohada de Pluma de Ganso', quantity: 1, price: 19500 }, { productId: '17', productName: 'Mantel de Lino Natural', quantity: 1, price: 28500 }] },
  { id: 'ORD-004', customerName: 'Laura Martínez', customerEmail: 'laura@email.com', date: '2026-03-05', total: 32500, status: 'Entregado', items: [{ productId: '2', productName: 'Sábanas de Percal Suave', quantity: 1, price: 32500 }] },
  { id: 'ORD-005', customerName: 'Diego Fernández', customerEmail: 'diego@email.com', date: '2026-03-01', total: 22500, status: 'Entregado', items: [{ productId: '6', productName: 'Set de Toallas Spa x3', quantity: 1, price: 22500 }] },
];
