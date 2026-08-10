import { useState, useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useSpecialStore } from '@/stores/specialStore';
import { formatPrice } from '@/services/shippingService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, Search, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';

const AdminSpecials = () => {
  const products = useProductStore((s) => s.products);
  const { specials, loading, fetchSpecials, addSpecial, updateSpecial, deleteSpecial } = useSpecialStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchSpecials(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setProductIds([]);
    setSearch('');
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    const special = specials.find((s) => s.id === id);
    if (!special) return;
    setEditingId(id);
    setTitle(special.title);
    setProductIds([...special.productIds]);
    setSearch('');
    setFormOpen(true);
  };

  const toggleProduct = (productId: string) => {
    setProductIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  const moveProduct = (index: number, dir: -1 | 1) => {
    setProductIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Ingresá un título'); return; }
    if (productIds.length === 0) { toast.error('Seleccioná al menos un producto'); return; }
    try {
      if (editingId) {
        await updateSpecial(editingId, { title: title.trim(), productIds });
        toast.success('Especial actualizado');
      } else {
        await addSpecial({ title: title.trim(), productIds });
        toast.success('Especial creado');
      }
      setFormOpen(false);
    } catch {
      toast.error('Error al guardar el especial');
    }
  };

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const productName = (id: string) => products.find((p) => p.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-foreground">Especiales</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Carruseles con título y productos propios. Activá uno para mostrarlo en el Home (o ninguno).
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity shrink-0">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-10">Cargando especiales...</p>
      ) : specials.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-10">Todavía no hay especiales creados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specials.map((special) => {
            const selectedProducts = special.productIds
              .map((id) => products.find((p) => p.id === id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            return (
              <div key={special.id} className={`rounded-lg border p-4 space-y-3 ${special.active ? 'border-foreground' : 'border-accent'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{special.title}</p>
                    <p className="font-body text-xs text-muted-foreground">{special.productIds.length} productos</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(special.id)} className="p-1.5 rounded hover:bg-accent transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('¿Eliminar este especial?')) {
                          try { await deleteSpecial(special.id); toast.success('Especial eliminado'); } catch { toast.error('Error al eliminar'); }
                        }
                      }}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedProducts.slice(0, 4).map((p) => (
                      <img key={p.id} src={p.images?.[0] || p.image} alt={p.name} className="h-14 w-14 rounded-md object-cover border border-accent" />
                    ))}
                    {selectedProducts.length > 4 && (
                      <span className="font-body text-xs text-muted-foreground">+{selectedProducts.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-accent">
                  <span className="font-body text-xs text-muted-foreground">Mostrar en Home</span>
                  <Switch
                    checked={special.active}
                    onCheckedChange={async (checked) => {
                      try {
                        await updateSpecial(special.id, { active: checked });
                        toast.success(checked ? 'Especial activado en el Home' : 'Especial desactivado');
                      } catch { toast.error('Error al actualizar'); }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) setFormOpen(false); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editingId ? 'Editar especial' : 'Crear especial'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4 min-w-0">
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Oferta de invierno"
                className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Productos ({productIds.length} seleccionados)</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full rounded-md border border-accent bg-background pl-9 pr-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              {productIds.length > 0 && (
                <div className="mb-3 rounded-md border border-accent p-2 space-y-1 max-h-32 overflow-y-auto">
                  {productIds.map((id, index) => {
                    const p = products.find((prod) => prod.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 text-sm font-body min-w-0">
                        <span className="text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
                        <span className="flex-1 truncate text-foreground">{p?.name || id}</span>
                        <button onClick={() => moveProduct(index, -1)} disabled={index === 0} className="p-0.5 hover:bg-accent rounded disabled:opacity-30 transition-colors">
                          <MoveUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => moveProduct(index, 1)} disabled={index === productIds.length - 1} className="p-0.5 hover:bg-accent rounded disabled:opacity-30 transition-colors">
                          <MoveDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => toggleProduct(id)} className="p-0.5 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-md border border-accent divide-y divide-accent max-h-64 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="p-4 font-body text-sm text-muted-foreground">No se encontraron productos.</p>
                ) : filteredProducts.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent/40 transition-colors min-w-0">
                    <Checkbox
                      checked={productIds.includes(p.id)}
                      onCheckedChange={() => toggleProduct(p.id)}
                    />
                    <img src={p.images?.[0] || p.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-body text-sm text-foreground truncate">{p.name}</span>
                      <span className="block font-body text-xs text-muted-foreground">{formatPrice(p.price)} · {p.brand}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity"
            >
              {editingId ? 'Guardar cambios' : 'Crear especial'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSpecials;
