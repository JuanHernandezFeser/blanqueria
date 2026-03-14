import { useState } from 'react';
import { calculateShipping, formatPrice } from '@/services/shippingService';
import { Truck } from 'lucide-react';

const ShippingCalculator = () => {
  const [postalCode, setPostalCode] = useState('');
  const result = calculateShipping(postalCode);

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
        className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
      />
      {result && (
        <div className="flex items-center justify-between text-sm font-body">
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
