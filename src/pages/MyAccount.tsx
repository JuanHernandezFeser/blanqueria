import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatPrice } from '@/services/shippingService';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLayout from '@/components/shared/PageLayout';
import { formatDate } from '@/lib/helpers';
import { CreditCard, Banknote, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Order } from '@/data/orders';

const MyAccount = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { orders, fetchOrders } = useOrderStore();
  useEffect(() => { fetchOrders(); }, []);
  const bankConfig = useBankConfigStore((s) => s.config);
  const navigate = useNavigate();
  const [showTransferInfo, setShowTransferInfo] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" />;

  const userOrders = orders.filter((o) => o.customerEmail === user.email);

  return (
    <PageLayout className="max-w-2xl">
      <h1 className="font-display text-4xl text-foreground mb-8">Mi Cuenta</h1>
      <div className="space-y-6">
        <div className="rounded-lg bg-secondary/50 p-6 space-y-3">
          <p className="font-body text-sm text-muted-foreground">Nombre</p>
          <p className="font-body text-foreground font-medium">{user.name}</p>
          <p className="font-body text-sm text-muted-foreground">Email</p>
          <p className="font-body text-foreground">{user.email}</p>
          <button onClick={logout} className="mt-4 rounded-md border border-accent px-4 py-2 text-xs font-body uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all">
            Cerrar sesión
          </button>
        </div>

        <div>
          <h2 className="font-display text-2xl text-foreground mb-4">Mis Pedidos</h2>
          {userOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-body text-sm text-muted-foreground mb-4">No tenés pedidos todavía.</p>
              <button onClick={() => navigate('/catalogo')} className="inline-block rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
                Explorar catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((o: Order) => (
                <div key={o.id}>
                  <div className="rounded-lg shadow-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{o.id}</p>
                        <p className="font-body text-xs text-muted-foreground">{formatDate(o.date)}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <StatusBadge status={o.orderStatus} />
                        <p className="font-body text-sm tabular-nums font-medium text-foreground">{formatPrice(o.total)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                      <div className="flex items-center gap-1">
                        {o.paymentMethod === 'mercadopago' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                        <span>{o.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}</span>
                      </div>
                      <span className={`${o.paymentStatus === 'aprobado' ? 'text-green-600' : o.paymentStatus === 'rechazado' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {o.paymentStatus === 'aprobado' ? 'Pagado' : o.paymentStatus === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                      </span>
                      {o.paymentMethod === 'transferencia' && o.paymentStatus === 'pendiente' && (
                        <button onClick={() => setShowTransferInfo(showTransferInfo === o.id ? null : o.id)} className="flex items-center gap-1 text-foreground underline">
                          <Eye className="h-3 w-3" /> Datos para transferir
                        </button>
                      )}
                    </div>
                  </div>
                  {showTransferInfo === o.id && (
                    <div className="rounded-lg bg-secondary/50 p-4 mt-1 space-y-1 text-sm font-body">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Datos para transferir</p>
                      <p className="text-foreground">Banco: {bankConfig.bankName}</p>
                      <p className="text-foreground">CBU: {bankConfig.cbu}</p>
                      <p className="text-foreground">Alias: {bankConfig.alias}</p>
                      <p className="text-foreground">Titular: {bankConfig.accountHolder}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MyAccount;
