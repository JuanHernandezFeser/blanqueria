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

export interface BankConfig {
  bankName: string;
  cbu: string;
  alias: string;
  accountHolder: string;
}

export interface MpPreferenceRequest {
  items: { title: string; quantity: number; unitPrice: number }[];
  customerEmail: string;
}

export interface MpPreferenceResponse {
  initPoint: string;
  preferenceId: string;
}
