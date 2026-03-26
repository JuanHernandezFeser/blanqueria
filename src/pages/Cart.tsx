import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { formatPrice } from '@/services/shippingService';
import ShippingCalculator from '@/components/ShippingCalculator';
import ProductDetail from '@/components/ProductDetail';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Product } from '@/data/products';

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const products = useProductStore((s) => s.products);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleCheckout = () => {
    if (!user) {
      toast.info('Por favor ingresá a tu cuenta para finalizar la compra');
      navigate('/login');
      return;
    }
    setCheckoutDone(true);
    clearCart();
    toast.success('¡Pedido realizado con éxito!');
  };

  const handleProductClick = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) setSelectedProduct(product);
  };

  if (checkoutDone) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <h1 className="font-display text-4xl text-foreground mb-4">¡Gracias por tu compra!</h1>
        <p className="font-body text-muted-foreground mb-8">Tu pedido fue procesado exitosamente. Te enviaremos un email con los detalles.</p>
        <Link to="/catalogo" className="inline-block rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-3xl text-foreground mb-2">Tu carrito está vacío</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">Explorá nuestro catálogo y encontrá lo que necesitás.</p>
        <Link to="/catalogo" className="inline-block rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-4xl text-foreground mb-8">Carrito</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.variant ?? ''}`} className="flex gap-4 rounded-lg shadow-card p-4">
              <div
                onClick={() => handleProductClick(item.product.id)}
                className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">{item.product.brand}</p>
                <p
                  onClick={() => handleProductClick(item.product.id)}
                  className="font-body text-sm font-medium text-foreground truncate cursor-pointer hover:underline"
                >
                  {item.product.name}
                </p>
                {item.variant && <p className="font-body text-xs text-muted-foreground">{item.variant}</p>}
                <p className="font-body text-sm tabular-nums text-foreground mt-1">{formatPrice(item.product.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)} className="p-1 rounded hover:bg-accent transition-colors">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-body text-sm tabular-nums w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)} className="p-1 rounded hover:bg-accent transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => { removeItem(item.product.id, item.variant); toast.info('Producto eliminado'); }} className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg shadow-card p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground">Resumen</h2>
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums text-foreground font-medium">{formatPrice(subtotal())}</span>
            </div>
            <ShippingCalculator />
            <button onClick={handleCheckout} className="w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>

      <ProductDetail product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

export default Cart;
