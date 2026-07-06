import { useState, useEffect } from 'react';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice } from '@/services/shippingService';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/helpers';
import { CreditCard, Banknote, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrders = () => {
  const { orders, loading, fetchOrders, updateStatus } = useOrderStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  if (loading) return <p className="font-body text-sm text-muted-foreground text-center py-10">Cargando pedidos...</p>;
  if (orders.length === 0) {
    return <p className="font-body text-sm text-muted-foreground text-center py-10">No hay pedidos todavía.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-muted-foreground">{orders.length} pedidos</p>
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg shadow-card overflow-hidden">
          <div
            onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="font-body text-sm font-medium text-foreground">{o.id}</p>
                <p className="font-body text-xs text-muted-foreground">{o.customerName} · {formatDate(o.date)}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-body">
                {o.paymentMethod === 'mercadopago' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                <span>{o.paymentMethod === 'mercadopago' ? 'MP' : 'Transf.'}</span>
              </div>
              <StatusBadge status={o.orderStatus} />
              <p className="font-body text-sm tabular-nums font-medium text-foreground">{formatPrice(o.total)}</p>
            </div>
          </div>
          {expandedOrder === o.id && (
            <div className="border-t border-accent p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cliente</p>
                  <p className="text-foreground">{o.customerName}</p>
                  <p className="text-muted-foreground">{o.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Envío</p>
                  <p className="text-foreground">{o.shippingAddress.address}</p>
                  <p className="text-muted-foreground">{o.shippingAddress.city}, {o.shippingAddress.province}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-body">Productos</p>
                <div className="space-y-1">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm font-body">
                      <span className="text-foreground">{item.productName} <span className="text-muted-foreground">x{item.quantity}</span></span>
                      <span className="tabular-nums text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm font-body border-t border-accent pt-2">
                <span>Subtotal: {formatPrice(o.subtotal)}</span>
                {o.shippingCost > 0 && <span>Envío: {formatPrice(o.shippingCost)}</span>}
                <span className="font-medium">Total: {formatPrice(o.total)}</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-body">Estado:</span>
                <select
                  value={o.orderStatus}
                  onChange={async (e) => { try { await updateStatus(o.id, e.target.value as any); toast.success('Estado actualizado'); } catch { toast.error('Error al actualizar'); } }}
                  className="rounded-md border border-accent bg-background px-3 py-1.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En preparación">En preparación</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Entregado">Entregado</option>
                </select>
                <span className="text-xs text-muted-foreground font-body">
                  Pago: {o.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'} · {o.paymentStatus === 'aprobado' ? 'Aprobado' : o.paymentStatus === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminOrders;
