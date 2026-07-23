const API_BASE = 'https://api.aikenblanco.com.ar/api';

let token: string | null = localStorage.getItem('auth-token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('auth-token', t);
  else localStorage.removeItem('auth-token');
}

export function getToken(): string | null {
  if (!token) token = localStorage.getItem('auth-token');
  return token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error de conexión');
  }
  return res.json();
}

export interface User { email: string; name: string; isAdmin: boolean; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string; emailVerified?: boolean; }
export interface MpPreferenceResponse { initPoint: string; preferenceId: string; }
export interface CreateOrderPayload {
  customerName: string; customerEmail: string;
  shippingAddress: { address: string; city: string; province: string; postalCode: string; phone: string };
  items: { productId: string; productName: string; quantity: number; price: number; variant?: string }[];
  subtotal: number; shippingCost: number; total: number;
  paymentMethod: 'mercadopago' | 'transferencia'; paymentStatus: 'aprobado' | 'pendiente' | 'rechazado';
  source?: 'web' | 'manual';
}

export const api = {
  login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  register(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  verifyEmail(token: string): Promise<{ message: string }> {
    return request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
  },
  resendVerification(email: string): Promise<{ message: string }> {
    return request('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
  },
  updateProfile(data: { name: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string }): Promise<{ message: string }> {
    return request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  },
  getMe(): Promise<User> { return request('/auth/me'); },

  getProducts<T = any>(): Promise<T> { return request('/products'); },
  getProduct<T = any>(id: string): Promise<T> { return request(`/products/${id}`); },
  createProduct<T = any>(data: any): Promise<T> {
    return request('/products', { method: 'POST', body: JSON.stringify(data) });
  },
  updateProduct<T = any>(id: string, data: any): Promise<T> {
    return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteProduct(id: string): Promise<void> {
    return request('/products/' + id, { method: 'DELETE' });
  },

  getAmbientes<T = any>(): Promise<T> { return request('/ambientes'); },
  createAmbiente<T = any>(data: any): Promise<T> {
    return request('/ambientes', { method: 'POST', body: JSON.stringify(data) });
  },
  updateAmbiente<T = any>(name: string, data: any): Promise<T> {
    return request(`/ambientes/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteAmbiente(name: string): Promise<void> {
    return request('/ambientes/' + encodeURIComponent(name), { method: 'DELETE' });
  },

  getCategories<T = any>(): Promise<T> { return request('/categories'); },
  createCategory<T = any>(data: any): Promise<T> {
    return request('/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  updateCategory<T = any>(name: string, data: any): Promise<T> {
    return request(`/categories/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteCategory(name: string): Promise<void> {
    return request('/categories/' + encodeURIComponent(name), { method: 'DELETE' });
  },

  getHeroSlides<T = any>(): Promise<T> { return request('/hero-slides'); },
  createHeroSlide<T = any>(data: any): Promise<T> {
    return request('/hero-slides', { method: 'POST', body: JSON.stringify(data) });
  },
  updateHeroSlide<T = any>(id: string, data: any): Promise<T> {
    return request(`/hero-slides/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteHeroSlide(id: string): Promise<void> {
    return request('/hero-slides/' + id, { method: 'DELETE' });
  },
  reorderHeroSlides(data: { id: string; order: number }[]): Promise<void> {
    return request('/hero-slides/reorder', { method: 'POST', body: JSON.stringify(data) });
  },

  createMpPreference(payload: { items: { title: string; quantity: number; unitPrice: number }[]; customerEmail: string; orderId?: string }): Promise<MpPreferenceResponse> {
    return request('/create-preference', { method: 'POST', body: JSON.stringify(payload) });
  },

  createOrder(payload: CreateOrderPayload): Promise<any> {
    return request('/orders', { method: 'POST', body: JSON.stringify(payload) });
  },
  getOrders<T = any>(email?: string): Promise<T> {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return request(`/orders${q}`);
  },
  updateOrderStatus(id: string, orderStatus: string): Promise<void> {
    return request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ orderStatus }) });
  },

  getBankConfig<T = any>(): Promise<T> { return request('/bank-config'); },
  updateBankConfig<T = any>(config: any): Promise<T> {
    return request('/bank-config', { method: 'PUT', body: JSON.stringify(config) });
  },

  async upload<T = any>(files: FileList | File[]): Promise<T> {
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    const headers: Record<string, string> = {};
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      if (res.status === 401) setToken(null);
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Error de conexión');
    }
    return res.json();
  },
};
