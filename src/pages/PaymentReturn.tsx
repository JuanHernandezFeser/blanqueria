import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { useOrderStore } from '@/stores/orderStore';
import { api } from '@/services/api';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, clearCart } = useCartStore();
  const { updateProduct } = useProductStore();
  const { addOrder } = useOrderStore();
  const [status, setStatus] = useState<'processing' | 'approved' | 'pending' | 'failure'>('processing');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const paymentStatus = searchParams.get('status');

    if (paymentStatus === 'approved') {
      setStatus('approved');
      if (items.length > 0 && user) {
        (async () => {
          try {
            items.forEach((item) => {
              const p = item.product;
              if (p.variantStock && item.variant) {
                const key = item.variant;
                const current = p.variantStock[key] ?? 0;
                updateProduct(p.id, { variantStock: { ...p.variantStock, [key]: Math.max(0, current - item.quantity) } });
              } else {
                updateProduct(p.id, { stock: Math.max(0, p.stock - item.quantity) });
              }
            });

            const created = await api.createOrder({
              customerName: user?.name || '',
              customerEmail: user?.email || '',
              shippingAddress: { address: '', city: '', province: '', postalCode: '', phone: '' },
              items: items.map((i) => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, price: i.product.price, variant: i.variant })),
              subtotal: subtotal(),
              shippingCost: 0,
              total: subtotal(),
              paymentMethod: 'mercadopago',
              paymentStatus: 'aprobado',
            });
            setOrderId(created.id);
            clearCart();
          } catch { /* ignore */ }
        })();
      }
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else if (paymentStatus === 'failure' || paymentStatus === 'null') {
      setStatus('failure');
    } else {
      setStatus('processing');
      setTimeout(() => setStatus('failure'), 5000);
    }
  }, []);

  return (
    <div className="container max-w-lg py-20 text-center">
      {status === 'processing' && (
        <div>
          <Loader2 className="h-12 w-12 text-foreground mx-auto mb-4 animate-spin" />
          <h1 className="font-display text-3xl text-foreground mb-2">Verificando pago...</h1>
          <p className="font-body text-sm text-muted-foreground">Por favor esperá mientras confirmamos tu pago.</p>
        </div>
      )}

      {status === 'approved' && (
        <div>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-foreground mb-2">¡Pago aprobado!</h1>
          <p className="font-body text-muted-foreground mb-2">Pedido <span className="font-medium text-foreground">{orderId}</span></p>
          <p className="font-body text-sm text-muted-foreground mb-8">Recibirás un email con los detalles de tu compra.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/catalogo" className="rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              Seguir comprando
            </Link>
            <Link to="/mi-cuenta" className="rounded-md border border-accent px-6 py-3 text-xs font-medium uppercase tracking-wider text-foreground font-body hover:bg-accent transition-colors">
              Mis pedidos
            </Link>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div>
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-foreground mb-2">Pago pendiente</h1>
          <p className="font-body text-muted-foreground mb-8">Estamos esperando la confirmación del pago. Te avisaremos cuando se acredite.</p>
          <Link to="/mi-cuenta" className="rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
            Mis pedidos
          </Link>
        </div>
      )}

      {status === 'failure' && (
        <div>
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-foreground mb-2">Pago rechazado</h1>
          <p className="font-body text-muted-foreground mb-8">El pago no pudo procesarse. Podés intentar de nuevo o elegir otro método.</p>
          <Link to="/checkout" className="rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
            Intentar de nuevo
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaymentReturn;
