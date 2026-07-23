import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useProductStore } from '@/stores/productStore';
import { useOrderStore } from '@/stores/orderStore';
import { getTotalStock, variantStockKey } from '@/data/products';
import { api } from '@/services/api';
import { provinces } from '@/lib/helpers';
import { toast } from 'sonner';

interface ProductRow {
  productId: string;
  variant: string;
  color: string;
  quantity: number;
  price: number;
}

const emptyRow = (): ProductRow => ({ productId: '', variant: '', color: '', quantity: 1, price: 0 });

const ManualOrderForm = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const addOrder = useOrderStore((s) => s.addOrder);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'mercadopago'>('transferencia');
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'aprobado'>('pendiente');
  const [rows, setRows] = useState<ProductRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchProducts();
  }, [open]);

  const selectedProduct = (id: string) => products.find((p) => p.id === id);

  const updateRow = (index: number, field: keyof ProductRow, value: string | number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value as never };
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        next[index].price = product?.price ?? 0;
        next[index].variant = '';
        next[index].color = '';
      }
      return next;
    });
  };

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const subtotal = rows.reduce((sum, r) => sum + r.price * r.quantity, 0);
  const total = subtotal + Number(shippingCost);

  const handleSubmit = async () => {
    if (!customerName || !customerEmail || !address || !city || !province || !postalCode) {
      toast.error('Completá todos los datos del cliente');
      return;
    }
    if (rows.some((r) => !r.productId || r.quantity < 1)) {
      toast.error('Completá todos los productos');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = `ORD-MAN-${Date.now()}`;
      const items = rows.map((r) => {
        const p = selectedProduct(r.productId)!;
        const label = [p.name, r.variant, r.color].filter(Boolean).join(' — ');
        return {
          productId: r.productId,
          productName: label,
          quantity: r.quantity,
          price: r.price,
          variant: variantStockKey(r.variant, r.color) || undefined,
        };
      });

      await api.createOrder({
        customerName,
        customerEmail,
        shippingAddress: { address, city, province, postalCode, phone },
        items,
        subtotal,
        shippingCost: Number(shippingCost),
        total,
        paymentMethod,
        paymentStatus,
        source: 'manual',
      });

      for (const r of rows) {
        const p = selectedProduct(r.productId);
        if (!p) continue;
        const key = variantStockKey(r.variant, r.color);
        if (p.variantStock && Object.keys(p.variantStock).length > 0) {
          const current = p.variantStock[key] ?? 0;
          await updateProduct(p.id, { variantStock: { ...p.variantStock, [key]: Math.max(0, current - r.quantity) } });
        } else {
          await updateProduct(p.id, { stock: Math.max(0, p.stock - r.quantity) });
        }
      }

      addOrder({
        id,
        customerName,
        customerEmail,
        date: now,
        subtotal,
        shippingCost: Number(shippingCost),
        total,
        orderStatus: 'Pendiente',
        paymentMethod,
        paymentStatus,
        source: 'manual',
        items,
        shippingAddress: { address, city, province, postalCode, phone },
      });

      toast.success('Pedido manual creado');
      onClose();
      resetForm();
    } catch {
      toast.error('Error al crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setProvince('');
    setPostalCode('');
    setShippingCost(0);
    setPaymentMethod('transferencia');
    setPaymentStatus('pendiente');
    setRows([emptyRow()]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Cargar pedido manual</DialogTitle>
          <DialogDescription>Completá los datos del cliente y los productos del pedido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <fieldset className="space-y-3">
            <legend className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Datos del cliente</legend>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nombre" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="col-span-2 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <input placeholder="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <input placeholder="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <input placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)}
                className="col-span-2 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <input placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)}
                className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <select value={province} onChange={(e) => setProvince(e.target.value)}
                className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                <option value="">Provincia</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Código Postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
          </fieldset>

          {/* Productos */}
          <fieldset className="space-y-3">
            <legend className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Productos</legend>
            {rows.map((row, i) => {
              const product = selectedProduct(row.productId);
              return (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-accent p-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Producto</label>
                    <select value={row.productId} onChange={(e) => updateRow(i, 'productId', e.target.value)}
                      className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                      <option value="">Seleccionar</option>
                      {products.filter((p) => getTotalStock(p) > 0).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — ${p.price.toLocaleString('es-AR')}</option>
                      ))}
                    </select>
                  </div>
                  {product?.variants && product.variants.length > 0 && (
                    <div>
                      <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Talle</label>
                      <select value={row.variant} onChange={(e) => updateRow(i, 'variant', e.target.value)}
                        className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                        <option value="">Sin talle</option>
                        {product.variants.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  )}
                  {product?.colors && product.colors.length > 0 && (
                    <div>
                      <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Color</label>
                      <select value={row.color} onChange={(e) => updateRow(i, 'color', e.target.value)}
                        className="rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                        <option value="">Sin color</option>
                        {product.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="w-20">
                    <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cant.</label>
                    <input type="number" min={1} value={row.quantity} onChange={(e) => updateRow(i, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                  </div>
                  <div className="w-24">
                    <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Precio</label>
                    <input type="number" min={0} value={row.price} onChange={(e) => updateRow(i, 'price', Number(e.target.value))}
                      className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1}
                    className="pb-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addRow}
              className="flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" /> Agregar producto
            </button>
          </fieldset>

          {/* Envío y pago */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Costo de envío</label>
              <input type="number" min={0} value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Método de pago</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                <option value="transferencia">Transferencia</option>
                <option value="mercadopago">Mercado Pago</option>
              </select>
            </div>
            <div>
              <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estado del pago</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
              </select>
            </div>
          </div>

          {/* Resumen */}
          <div className="rounded-lg bg-secondary p-3 space-y-1 text-sm font-body text-foreground">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span className="tabular-nums">${Number(shippingCost).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between border-t border-accent pt-1 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-md border border-accent px-4 py-2 text-sm font-body text-foreground hover:bg-accent transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-body text-background hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear pedido'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualOrderForm;
