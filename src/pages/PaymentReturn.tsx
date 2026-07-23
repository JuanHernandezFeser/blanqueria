import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState<'approved' | 'pending' | 'failure'>('failure');

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    clearCart();
    if (paymentStatus === 'approved') {
      setStatus('approved');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else {
      setStatus('failure');
    }
  }, []);

  return (
    <div className="container max-w-lg py-20 text-center">
      {status === 'approved' && (
        <div>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-foreground mb-2">¡Pago aprobado!</h1>
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
