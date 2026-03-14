import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { Navigate } from 'react-router-dom';
import { formatPrice } from '@/services/shippingService';
import { categories, type Category, type Product } from '@/data/products';
import { mockOrders } from '@/data/orders';
import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const emptyForm = { name: '', description: '', brand: '', category: 'Sábanas' as Category, price: 0, stock: 0, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop' };

const Admin = () => {
  const user = useAuthStore((s) => s.user);
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const openNew = () => { setForm(emptyForm); setEditProduct(null); setShowForm(true); };
  const openEdit = (p: Product) => { setForm({ name: p.name, description: p.description, brand: p.brand, category: p.category, price: p.price, stock: p.stock, image: p.image }); setEditProduct(p); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.brand || form.price <= 0) { toast.error('Completá todos los campos'); return; }
    if (editProduct) {
      updateProduct(editProduct.id, form);
      toast.success('Producto actualizado');
    } else {
      addProduct(form);
      toast.success('Producto creado');
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Producto eliminado');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-100 text-green-800';
      case 'Enviado': return 'bg-blue-100 text-blue-800';
      case 'En preparación': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-secondary text-foreground';
    }
  };

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-4xl text-foreground mb-6">Panel de Administración</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('products')} className={`font-body text-sm px-4 py-2 rounded-md transition-colors ${tab === 'products' ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
          Productos
        </button>
        <button onClick={() => setTab('orders')} className={`font-body text-sm px-4 py-2 rounded-md transition-colors ${tab === 'orders' ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
          Pedidos
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="font-body text-sm text-muted-foreground">{products.length} productos</p>
            <button onClick={openNew} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Nuevo Producto
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg shadow-card">
            <table className="w-full">
              <thead className="sticky top-0 bg-background/80 backdrop-blur-md">
                <tr className="border-b border-accent">
                  <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Producto</th>
                  <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Marca</th>
                  <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Categoría</th>
                  <th className="text-right p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Precio</th>
                  <th className="text-right p-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Stock</th>
                  <th className="text-right p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-accent/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-body text-sm text-foreground truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">{p.brand}</td>
                    <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className="p-3 text-right font-body text-sm tabular-nums text-foreground">{formatPrice(p.price)}</td>
                    <td className="p-3 text-right hidden sm:table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-body font-medium ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.stock > 0 ? `${p.stock}` : 'Sin stock'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-accent transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full">
            <thead className="sticky top-0 bg-background/80 backdrop-blur-md">
              <tr className="border-b border-accent">
                <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Pedido</th>
                <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Cliente</th>
                <th className="text-left p-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Fecha</th>
                <th className="text-right p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="text-right p-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((o) => (
                <tr key={o.id} className="border-b border-accent/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 font-body text-sm font-medium text-foreground">{o.id}</td>
                  <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">{o.customerName}</td>
                  <td className="p-3 font-body text-sm text-muted-foreground hidden sm:table-cell">{o.date}</td>
                  <td className="p-3 text-right font-body text-sm tabular-nums text-foreground">{formatPrice(o.total)}</td>
                  <td className="p-3 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium ${statusColor(o.status)}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Marca</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                  {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Precio</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Stock</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">URL de imagen</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <button onClick={handleSave} className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
