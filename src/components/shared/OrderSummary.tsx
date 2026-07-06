import { formatPrice } from '@/services/shippingService';

interface OrderSummaryProps {
  subtotal: number;
  shippingCost?: number;
  total: number;
}

const OrderSummary = ({ subtotal, shippingCost = 0, total }: OrderSummaryProps) => (
  <div className="rounded-lg shadow-card p-6 space-y-4">
    <h2 className="font-display text-xl text-foreground">Resumen</h2>
    <div className="border-t border-accent pt-3 space-y-2">
      <div className="flex justify-between font-body text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums text-foreground font-medium">{formatPrice(subtotal)}</span>
      </div>
      {shippingCost > 0 && (
        <div className="flex justify-between font-body text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span className="tabular-nums text-foreground font-medium">{formatPrice(shippingCost)}</span>
        </div>
      )}
      <div className="flex justify-between font-body text-sm border-t border-accent pt-2">
        <span className="text-foreground font-medium">Total</span>
        <span className="tabular-nums text-foreground font-bold">{formatPrice(total)}</span>
      </div>
    </div>
  </div>
);

export default OrderSummary;
