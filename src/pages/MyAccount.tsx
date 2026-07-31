import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatPrice } from '@/services/shippingService';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLayout from '@/components/shared/PageLayout';
import { formatDate, provinces } from '@/lib/helpers';
import { CreditCard, Banknote, Eye, ChevronDown, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Order } from '@/data/orders';
import { toast } from 'sonner';

const inputClass = 'w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground';

const MyAccount = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { orders, fetchOrders } = useOrderStore();
  useEffect(() => { fetchOrders(); }, []);
  const bankConfig = useBankConfigStore((s) => s.config);
  const navigate = useNavigate();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showTransferInfo, setShowTransferInfo] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [province, setProvince] = useState(user?.province || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');

  if (!user) return <Navigate to="/login" />;

  const userOrders = orders.filter((o) => o.customerEmail === user.email);

  const startEditing = () => {
    setName(user.name || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setLocality(user.locality || '');
    setProvince(user.province || '');
    setPostalCode(user.postalCode || '');
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone, address, locality, province, postalCode });
      toast.success('Datos actualizados');
      setEditing(false);
    } catch {
      toast.error('Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm('¿Seguro que querés eliminar tu cuenta? Se eliminará tu cuenta y el historial de tus pedidos. Esta acción no se puede deshacer.');
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Tu cuenta fue eliminada');
      navigate('/');
    } catch {
      toast.error('Error al eliminar la cuenta');
      setDeleting(false);
    }
  };

  return (
    <PageLayout className="max-w-3xl">
      <h1 className="font-display text-4xl text-foreground mb-8">Mi Cuenta</h1>
      <div className="space-y-6">
        <div className="rounded-lg bg-secondary/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl text-foreground">Mis datos</p>
            {!editing && (
              <button onClick={startEditing} className="flex items-center gap-1.5 rounded-md border border-accent px-3 py-1.5 text-xs font-body uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-body">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Nombre</p>
                <p className="text-foreground">{user.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                <p className="text-foreground">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Teléfono</p>
                  <p className="text-foreground">{user.phone}</p>
                </div>
              )}
              {user.address && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Dirección</p>
                  <p className="text-foreground">{user.address}</p>
                </div>
              )}
              {user.locality && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Localidad</p>
                  <p className="text-foreground">{user.locality}</p>
                </div>
              )}
              {(user.province || user.postalCode) && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Provincia / CP</p>
                  <p className="text-foreground">{[user.province, user.postalCode].filter(Boolean).join(' · ')}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Localidad</label>
                  <input type="text" value={locality} onChange={(e) => setLocality(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Provincia</label>
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
                    <option value="">Seleccionar</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Dirección</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Código postal</label>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputClass} />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Teléfono</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="rounded-md bg-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar cambios
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-accent px-6 py-2.5 text-xs font-body uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-accent">
            <button onClick={logout} className="rounded-md border border-accent px-4 py-2 text-xs font-body uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all">
              Cerrar sesión
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="flex items-center justify-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-xs font-body uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-50">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Eliminar cuenta
            </button>
          </div>
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
                  <div className="rounded-lg shadow-card overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                      className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-body text-sm font-medium text-foreground">{o.id}</p>
                        <p className="font-body text-xs text-muted-foreground">{formatDate(o.date)}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <StatusBadge status={o.orderStatus} />
                        <p className="font-body text-sm tabular-nums font-medium text-foreground">{formatPrice(o.total)}</p>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedOrder === o.id ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {expandedOrder === o.id && (
                      <div className="border-t border-accent p-4 space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-body">Productos</p>
                          <div className="space-y-1">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm font-body gap-4">
                                <span className="text-foreground">
                                  {item.productName}
                                  {item.variant && <span className="text-muted-foreground"> · {item.variant}</span>}
                                  <span className="text-muted-foreground"> x{item.quantity}</span>
                                </span>
                                <span className="tabular-nums text-foreground whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm font-body border-t border-accent pt-2 text-muted-foreground">
                          <span>Subtotal: <span className="text-foreground tabular-nums">{formatPrice(o.subtotal)}</span></span>
                          {o.shippingCost > 0 && <span>Envío: <span className="text-foreground tabular-nums">{formatPrice(o.shippingCost)}</span></span>}
                          <span className="font-medium text-foreground">Total: <span className="tabular-nums">{formatPrice(o.total)}</span></span>
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
                        {showTransferInfo === o.id && (
                          <div className="rounded-lg bg-secondary/50 p-4 space-y-1 text-sm font-body">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Datos para transferir</p>
                            <p className="text-foreground">Banco: {bankConfig.bankName}</p>
                            <p className="text-foreground">CBU: {bankConfig.cbu}</p>
                            <p className="text-foreground">Alias: {bankConfig.alias}</p>
                            <p className="text-foreground">Titular: {bankConfig.accountHolder}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
