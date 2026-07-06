import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { useOrderStore } from '@/stores/orderStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { formatPrice } from '@/services/shippingService';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { CreditCard, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import ShippingCalculator from '@/components/ShippingCalculator';
import EmptyCart from '@/components/shared/EmptyCart';
import OrderSummary from '@/components/shared/OrderSummary';
import PrimaryButton from '@/components/shared/PrimaryButton';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';
import PageLayout from '@/components/shared/PageLayout';
import { provinces } from '@/lib/helpers';

interface ShippingForm {
  name: string; email: string; address: string; city: string; province: string; postalCode: string; phone: string;
}

const Checkout = () => {
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, clearCart } = useCartStore();
  const { fetchProducts } = useProductStore();
  const { addOrder } = useOrderStore();
  const bankConfig = useBankConfigStore((s) => s.config);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [guestMode, setGuestMode] = useState(false);
  const [shipping, setShipping] = useState<ShippingForm>({
    name: user?.name || '', email: '', address: '', city: '', province: '', postalCode: '', phone: '',
  });
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (items.length === 0 && !orderDone) return <EmptyCart message="Agregá productos antes de finalizar la compra." actionLabel="Explorar Catálogo" />;

  if (!user && !guestMode) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto py-12 text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">Checkout</h1>
          <div className="space-y-3">
            <button onClick={() => setGuestMode(true)} className="w-full rounded-md bg-foreground py-4 text-sm font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              Comprar como invitado
            </button>
            <div className="pt-4 space-y-2">
              <p className="font-body text-xs text-muted-foreground text-center">¿Ya tenés cuenta?</p>
              <button onClick={() => navigate('/login')} className="w-full rounded-md border border-accent py-3 text-xs font-medium font-body text-foreground hover:bg-accent transition-colors">
                Iniciar sesión
              </button>
              <button onClick={() => navigate('/register')} className="w-full font-body text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 py-2">
                Crear cuenta nueva
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (orderDone) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <h1 className="font-display text-4xl text-foreground mb-4">¡Gracias por tu compra!</h1>
        <p className="font-body text-muted-foreground mb-2">Pedido <span className="font-medium text-foreground">{orderId}</span></p>
        {paymentMethod === 'transferencia' && (
          <div className="rounded-lg bg-secondary/50 p-6 text-left space-y-2 mb-6">
            <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Datos para transferir</p>
            <p className="font-body text-sm text-foreground">Banco: {bankConfig.bankName}</p>
            <p className="font-body text-sm text-foreground">CBU: {bankConfig.cbu}</p>
            <p className="font-body text-sm text-foreground">Alias: {bankConfig.alias}</p>
            <p className="font-body text-sm text-foreground">Titular: {bankConfig.accountHolder}</p>
          </div>
        )}
        <p className="font-body text-sm text-muted-foreground mb-8">Te enviaremos un email con los detalles del pedido.</p>
        {guestMode && (
          <div className="mb-6 p-4 rounded-lg bg-secondary/50">
            <p className="font-body text-sm text-foreground mb-2">¿Querés crear una cuenta para ver tus pedidos?</p>
            <Link to="/register" state={{ name: shipping.name, email: shipping.email, phone: shipping.phone, address: shipping.address, locality: shipping.city, province: shipping.province, postalCode: shipping.postalCode }} className="text-xs font-medium uppercase tracking-wider text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
              Crear cuenta ahora
            </Link>
          </div>
        )}
        <Link to="/catalogo" className="inline-block rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          Seguir comprando
        </Link>
      </div>
    );
  }

  const total = subtotal() + shippingCost;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.name || !shipping.address || !shipping.city || !shipping.province || !shipping.postalCode || !shipping.phone) {
      toast.error('Completá todos los datos de envío');
      return;
    }
    if (guestMode && !shipping.email) {
      toast.error('Ingresá tu email');
      return;
    }
    setStep(2);
  };

  const createOrderViaApi = async (paymentStatus: 'aprobado' | 'pendiente' | 'rechazado') => {
    const created = await api.createOrder({
      customerName: shipping.name, customerEmail: user?.email ?? shipping.email,
      shippingAddress: { address: shipping.address, city: shipping.city, province: shipping.province, postalCode: shipping.postalCode, phone: shipping.phone },
      items: items.map((i) => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, price: i.product.price, variant: i.variant })),
      subtotal: subtotal(), shippingCost, total, paymentMethod: paymentMethod!, paymentStatus,
    });
    addOrder(created);
    return created.id;
  };

  const isDev = import.meta.env.DEV;

  const handleMpPayment = async () => {
    setSubmitting(true);
    if (isDev) {
      setTimeout(async () => {
        try {
          const id = await createOrderViaApi('aprobado');
          setOrderId(id); clearCart(); setOrderDone(true); fetchProducts();
          toast.success('🧪 Pago simulado con éxito');
        } catch { toast.error('Error al crear pedido'); }
        setSubmitting(false);
      }, 1000);
      return;
    }
    try {
      const { initPoint } = await api.createMpPreference({
        items: items.map((i) => ({ title: i.product.name, quantity: i.quantity, unitPrice: i.product.price })),
        customerEmail: user?.email ?? shipping.email,
      });
      window.location.href = initPoint;
    } catch { toast.error('Error al conectar con Mercado Pago. Intentalo de nuevo.'); setSubmitting(false); }
  };

  const handleSimulatePayment = async () => {
    try {
      const id = await createOrderViaApi('aprobado');
      setOrderId(id); clearCart(); setOrderDone(true); fetchProducts();
      toast.success('🧪 Pago simulado — pedido creado como aprobado');
    } catch { toast.error('Error al crear pedido'); }
  };

  const handleTransferConfirm = async () => {
    setSubmitting(true);
    try {
      const id = await createOrderViaApi('pendiente');
      setOrderId(id); clearCart(); setOrderDone(true); fetchProducts();
      toast.success('Pedido creado con éxito');
    } catch { toast.error('Error al crear pedido'); }
    setSubmitting(false);
  };

  const handleMpFallback = async () => {
    try {
      const id = await createOrderViaApi('pendiente');
      setOrderId(id); clearCart(); setOrderDone(true); fetchProducts();
      toast.success('Pedido registrado. Te contactaremos para coordinar el pago.');
    } catch { toast.error('Error al crear pedido'); }
  };

  return (
    <PageLayout>
      <PageBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito', href: '/carrito' }, { label: 'Checkout' }]} />
      {isDev && (
        <div className="mb-6 rounded-md bg-yellow-100 text-yellow-800 px-4 py-3 text-sm font-body">
          🧪 Modo desarrollo — los pagos se simulan localmente. Las órdenes se guardan en el navegador.
        </div>
      )}
      <h1 className="font-display text-4xl text-foreground mb-8">Checkout</h1>

      <div className="flex items-center gap-2 mb-8 font-body text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${s <= step ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>{s}</div>
            <span className={`hidden sm:inline ${s <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Envío' : s === 2 ? 'Pago' : 'Confirmar'}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <h2 className="font-display text-2xl text-foreground mb-4">Datos de envío</h2>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre completo</label>
                <input value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              {guestMode && (
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
                  <input type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                </div>
              )}
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Dirección</label>
                <input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Ciudad</label>
                  <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Provincia</label>
                  <select value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                    <option value="">Seleccionar</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Código postal</label>
                  <input value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Teléfono</label>
                  <input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                </div>
              </div>
              <div className="pt-4"><ShippingCalculator onShippingChange={setShippingCost} /></div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity mt-4">
                Continuar al pago <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-foreground mb-4">Método de pago</h2>
              <button onClick={() => setPaymentMethod('mercadopago')} className={`w-full flex items-center gap-4 rounded-lg border-2 p-5 text-left transition-all ${paymentMethod === 'mercadopago' ? 'border-foreground bg-secondary/30' : 'border-accent hover:border-foreground/50'}`}>
                <CreditCard className="h-6 w-6 text-foreground flex-shrink-0" />
                <div>
                  <p className="font-body text-sm font-medium text-foreground">Mercado Pago</p>
                  <p className="font-body text-xs text-muted-foreground">Débito, crédito, transferencia o efectivo</p>
                </div>
              </button>
              <button onClick={() => setPaymentMethod('transferencia')} className={`w-full flex items-center gap-4 rounded-lg border-2 p-5 text-left transition-all ${paymentMethod === 'transferencia' ? 'border-foreground bg-secondary/30' : 'border-accent hover:border-foreground/50'}`}>
                <Banknote className="h-6 w-6 text-foreground flex-shrink-0" />
                <div>
                  <p className="font-body text-sm font-medium text-foreground">Transferencia bancaria</p>
                  <p className="font-body text-xs text-muted-foreground">CBU / Alias - Pago manual</p>
                </div>
              </button>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-md border border-accent px-6 py-3 text-xs font-body text-foreground hover:bg-accent transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Volver
                </button>
                <button onClick={() => { if (paymentMethod) setStep(3); else toast.error('Seleccioná un método de pago'); }} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-foreground mb-4">Confirmar pedido</h2>
              <div className="rounded-lg bg-secondary/50 p-5 space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Envío a</p>
                <p className="font-body text-sm text-foreground">{shipping.name}</p>
                <p className="font-body text-sm text-foreground">{shipping.address}</p>
                <p className="font-body text-sm text-foreground">{shipping.city}, {shipping.province} - CP {shipping.postalCode}</p>
                <p className="font-body text-sm text-foreground">Tel: {shipping.phone}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-5 space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Método de pago</p>
                <div className="flex items-center gap-2">
                  {paymentMethod === 'mercadopago' ? <CreditCard className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                  <p className="font-body text-sm text-foreground">{paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia bancaria'}</p>
                </div>
              </div>

              {paymentMethod === 'transferencia' && (
                <div className="rounded-lg bg-secondary/50 p-5 space-y-1">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Datos para transferir</p>
                  <p className="font-body text-sm text-foreground">Banco: {bankConfig.bankName}</p>
                  <p className="font-body text-sm text-foreground">CBU: {bankConfig.cbu}</p>
                  <p className="font-body text-sm text-foreground">Alias: {bankConfig.alias}</p>
                  <p className="font-body text-sm text-foreground">Titular: {bankConfig.accountHolder}</p>
                </div>
              )}

              {paymentMethod === 'mercadopago' && (
                <div className="flex flex-col gap-3 pt-2">
                  <PrimaryButton onClick={handleMpPayment} loading={submitting} loadingText="Conectando con Mercado Pago...">
                    Pagar con Mercado Pago
                  </PrimaryButton>
                  <button onClick={handleMpFallback} className="w-full rounded-md border border-accent py-3 text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
                    Pagar después (crear pedido pendiente)
                  </button>
                  {isDev && (
                    <button onClick={handleSimulatePayment} className="w-full rounded-md bg-green-600 py-3 text-xs font-medium uppercase tracking-wider text-white font-body hover:bg-green-700 transition-colors">
                      🧪 Simular pago aprobado (solo desarrollo)
                    </button>
                  )}
                </div>
              )}

              {paymentMethod === 'transferencia' && (
                <PrimaryButton onClick={handleTransferConfirm} loading={submitting}>
                  Confirmar pedido
                </PrimaryButton>
              )}

              <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 w-full rounded-md border border-accent py-3 text-xs font-body text-foreground hover:bg-accent transition-colors">
                <ChevronLeft className="h-4 w-4" /> Cambiar método de pago
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg shadow-card p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground">Resumen</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.variant ?? ''}`} className="flex gap-3">
                  <div className="w-12 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-foreground truncate">{item.product.name}</p>
                    {item.variant && <p className="font-body text-[10px] text-muted-foreground">{item.variant}</p>}
                    <p className="font-body text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="font-body text-xs tabular-nums text-foreground font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <OrderSummary subtotal={subtotal()} shippingCost={shippingCost} total={total} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Checkout;
