export interface PurchaseParams {
  value: number;
  currency: string;
  content_ids: string[];
  order_id: string;
}

export const trackAddToCart = (params: { content_name: string; content_ids: string[]; value: number; currency: string }) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddToCart', params);
  }
};

export const trackInitiateCheckout = (params: { value: number; currency: string; num_items: number; content_ids: string[] }) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', params);
  }
};

export const trackPurchase = (params: PurchaseParams) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', {
      value: params.value,
      currency: params.currency,
      content_ids: params.content_ids,
    });
  }
};

const trackedKey = (orderId: string) => `purchase_tracked_${orderId}`;
const pendingKey = (orderId: string) => `purchase_pending_${orderId}`;

export const isPurchaseTracked = (orderId: string): boolean => {
  try {
    return sessionStorage.getItem(trackedKey(orderId)) === '1';
  } catch {
    return false;
  }
};

export const markPurchaseTracked = (orderId: string): void => {
  try {
    sessionStorage.setItem(trackedKey(orderId), '1');
  } catch {
    return;
  }
};

export const trackPurchaseOnce = (params: PurchaseParams): void => {
  if (isPurchaseTracked(params.order_id)) return;
  markPurchaseTracked(params.order_id);
  trackPurchase(params);
};

export function savePendingPurchase(params: PurchaseParams): void {
  try {
    sessionStorage.setItem(pendingKey(params.order_id), JSON.stringify(params));
  } catch {
    return;
  }
}

export function consumePendingPurchase(orderId: string): PurchaseParams | null {
  try {
    const raw = sessionStorage.getItem(pendingKey(orderId));
    if (!raw) return null;
    sessionStorage.removeItem(pendingKey(orderId));
    return JSON.parse(raw) as PurchaseParams;
  } catch {
    return null;
  }
}
