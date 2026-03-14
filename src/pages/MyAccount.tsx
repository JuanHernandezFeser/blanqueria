import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { mockOrders } from '@/data/orders';
import { formatPrice } from '@/services/shippingService';

const MyAccount = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return <Navigate to="/login" />;

  const statusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-100 text-green-800';
      case 'Enviado': return 'bg-blue-100 text-blue-800';
      case 'En preparación': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-secondary text-foreground';
    }
  };

  return (
    <div className="container max-w-2xl py-12 md:py-20">
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
          {mockOrders.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">No tenés pedidos todavía.</p>
          ) : (
            <div className="space-y-3">
              {mockOrders.map((o) => (
                <div key={o.id} className="rounded-lg shadow-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{o.id}</p>
                    <p className="font-body text-xs text-muted-foreground">{o.date}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium ${statusColor(o.status)}`}>{o.status}</span>
                    <p className="font-body text-sm tabular-nums font-medium text-foreground">{formatPrice(o.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
