export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  SITE_URL: string;
  MERCADOPAGO_ACCESS_TOKEN: string;
  MERCADOPAGO_PUBLIC_KEY: string;
  MERCADOPAGO_WEBHOOK_SECRET: string;
  IMGBB_API_KEY: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

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
  source: 'web' | 'manual';
  items: OrderItem[];
  shippingAddress: ShippingAddress;
}

export interface BankConfig {
  bankName: string;
  cbu: string;
  alias: string;
  accountHolder: string;
  discountPercentage: number;
}

export interface MpPreferenceRequest {
  items: { title: string; quantity: number; unitPrice: number }[];
  customerEmail: string;
}

export interface MpPreferenceResponse {
  initPoint: string;
  preferenceId: string;
}
