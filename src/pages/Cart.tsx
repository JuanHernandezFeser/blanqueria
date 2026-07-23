import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { formatPrice, getDiscountedPrice } from '@/services/shippingService';
import ShippingCalculator from '@/components/ShippingCalculator';
import EmptyCart from '@/components/shared/EmptyCart';
import QuantitySelector from '@/components/shared/QuantitySelector';
import PageLayout from '@/components/shared/PageLayout';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [shippingCost, setShippingCost] = useState(0);
  const discountPercentage = useBankConfigStore((s) => s.config.discountPercentage);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleProductClick = (productId: string) => {
    navigate(`/producto/${productId}`);
  };

  if (items.length === 0) return <EmptyCart />;

  const sub = subtotal();
  const discountedSub = getDiscountedPrice(sub, discountPercentage);
  const hasDiscount = discountPercentage > 0;

  return (
    <PageLayout>
      <h1 className="font-display text-4xl text-foreground mb-8">Carrito</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemDiscountedPrice = getDiscountedPrice(item.product.price, discountPercentage);
            return (
              <div key={`${item.product.id}-${item.variant ?? ''}`} className="flex gap-4 rounded-lg shadow-card p-4" data-testid="cart-item">
                <div onClick={() => handleProductClick(item.product.id)} className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">{item.product.brand}</p>
                  <p onClick={() => handleProductClick(item.product.id)} className="font-body text-sm font-medium text-foreground truncate cursor-pointer hover:underline">{item.product.name}</p>
                  {item.variant && <p className="font-body text-xs text-muted-foreground">{item.variant}</p>}
                  <div className="space-y-0.5 mt-1">
                    <p className="font-body text-sm tabular-nums text-foreground">{formatPrice(item.product.price)}</p>
                    {hasDiscount && (
                      <p className="font-body text-xs tabular-nums text-gold">{formatPrice(itemDiscountedPrice)}<span className="ml-2">transferencia / efectivo</span></p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <QuantitySelector
                      quantity={item.quantity}
                      onDecrease={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                      onIncrease={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                    />
                    <button onClick={() => { removeItem(item.product.id, item.variant); toast.info('Producto eliminado'); }} className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg shadow-card p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground">Resumen</h2>
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums text-foreground font-medium">{formatPrice(sub)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-gold">Subtotal transferencia/efectivo</span>
                <span className="tabular-nums text-gold font-medium">{formatPrice(discountedSub)}</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="tabular-nums text-foreground font-medium">{formatPrice(shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-sm border-t border-accent pt-3">
              <span className="text-foreground font-medium">Total</span>
              <span className="tabular-nums text-foreground font-bold">{formatPrice(sub + shippingCost)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-gold font-medium">Total transferencia/efectivo</span>
                <span className="tabular-nums text-gold font-bold">{formatPrice(discountedSub + shippingCost)}</span>
              </div>
            )}
            <ShippingCalculator onShippingChange={setShippingCost} />
            <button onClick={handleCheckout} className="w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>

    </PageLayout>
  );
};

export default Cart;
