import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/services/shippingService';
import { Link, useNavigate } from 'react-router-dom';
import QuantitySelector from '@/components/shared/QuantitySelector';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onOpenChange(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background p-0 flex flex-col">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-accent">
          <SheetTitle className="font-display text-2xl text-foreground text-left flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Carrito
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-body text-sm text-muted-foreground mb-6">Tu carrito está vacío</p>
            <button onClick={() => onOpenChange(false)} className="rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.variant ?? ''}`} className="flex gap-3 rounded-lg bg-secondary/30 p-3">
                  <Link to={`/catalogo`} onClick={() => onOpenChange(false)} className="w-16 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">{item.product.brand}</p>
                    <p className="font-body text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    {item.variant && <p className="font-body text-xs text-muted-foreground">{item.variant}</p>}
                    <p className="font-body text-sm tabular-nums text-foreground mt-0.5">{formatPrice(item.product.price)}</p>
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
              ))}
            </div>

            <div className="border-t border-accent px-5 py-4 space-y-3">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums text-foreground font-medium">{formatPrice(subtotal())}</span>
              </div>
              <button onClick={handleCheckout} className="w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
                Finalizar Compra
              </button>
              <button onClick={() => { onOpenChange(false); navigate('/carrito'); }} className="w-full text-center font-body text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Ver carrito completo
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
