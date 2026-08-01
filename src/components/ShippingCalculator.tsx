import { useState, useEffect, useRef } from 'react';
import { quoteShipping, formatPrice, type CartItemInput, type ShippingResult } from '@/services/shippingService';
import { Truck, Loader2 } from 'lucide-react';

interface ShippingCalculatorProps {
  onShippingChange?: (cost: number) => void;
  cartItems?: CartItemInput[];
  cartSubtotal?: number;
}

const ShippingCalculator = ({ onShippingChange, cartItems = [], cartSubtotal = 0 }: ShippingCalculatorProps) => {
  const [postalCode, setPostalCode] = useState('');
  const [result, setResult] = useState<ShippingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!postalCode || postalCode.length < 4 || cartItems.length === 0) {
      setResult(null);
      setError(false);
      onShippingChange?.(0);
      return;
    }

    setLoading(true);
    setError(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await quoteShipping(postalCode, cartItems, cartSubtotal);
        setResult(res);
        onShippingChange?.(res.cost);
      } catch {
        setError(true);
        setResult(null);
        onShippingChange?.(0);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [postalCode, cartItems, cartSubtotal, onShippingChange]);

  return (
    <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Calcular envío</p>
      </div>
      <input
        type="text"
        placeholder="Código postal"
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        data-testid="shipping-input"
        className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
      />
      {loading && (
        <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Calculando envío...</span>
        </div>
      )}
      {error && (
        <p className="text-xs font-body text-destructive">No se pudo calcular el envío. Intentá de nuevo.</p>
      )}
      {result && !loading && (
        <div className="flex items-center justify-between text-sm font-body" data-testid="shipping-result">
          <div>
            <p className="text-foreground font-medium">{result.method}</p>
            <p className="text-xs text-muted-foreground">{result.days}</p>
          </div>
          <p className="tabular-nums text-foreground font-medium">{formatPrice(result.cost)}</p>
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
