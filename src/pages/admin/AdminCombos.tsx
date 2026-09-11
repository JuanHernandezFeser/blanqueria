import { useState, useEffect } from 'react';
import { useComboStore, type Combo } from '@/stores/comboStore';
import { useProductStore } from '@/stores/productStore';
import { formatPrice } from '@/services/shippingService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ComponentRow {
  productId: string;
  variant: string;
  color: string;
  quantity: number;
}

const emptyRow = (): ComponentRow => ({ productId: '', variant: '', color: '', quantity: 1 });

const ComponentPicker = ({ rows, onChange }: { rows: ComponentRow[]; onChange: (rows: ComponentRow[]) => void }) => {
  const products = useProductStore((s) => s.adminProducts);

  const selectedProduct = (id: string) => products.find((p) => p.id === id);

  const updateRow = (index: number, field: keyof ComponentRow, value: string | number) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value as never };
    if (field === 'productId') {
      next[index].variant = '';
      next[index].color = '';
    }
    onChange(next);
  };

  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyRow()]);

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const product = selectedProduct(row.productId);
        return (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-accent p-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Producto</label>
              <select value={row.productId} onChange={(e) => updateRow(i, 'productId', e.target.value)}
                className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                <option value="">Seleccionar</option>
                {products
                  .filter((p) => !p.isCombo)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
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
            <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= 1}
              className="pb-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={addRow}
        className="flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="h-3.5 w-3.5" /> Agregar componente
      </button>
    </div>
  );
};

const AdminCombos = () => {
  const { combos, loading, fetchCombos, addCombo, updateCombo, deleteCombo } = useComboStore();
  const fetchAdminProducts = useProductStore((s) => s.fetchAdminProducts);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [rows, setRows] = useState<ComponentRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCombos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setImage('');
    setRows([emptyRow()]);
    fetchAdminProducts();
    setFormOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditingId(combo.id);
    setName(combo.name);
    setDescription(combo.description ?? '');
    setPrice(String(combo.price));
    setImage(combo.image ?? '');
    setRows(combo.comboItems.map((c) => ({ productId: c.productId, variant: c.variant ?? '', color: c.color ?? '', quantity: c.quantity })));
    fetchAdminProducts();
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Ingresá un nombre'); return; }
    if (price === '' || Number(price) < 0) { toast.error('Ingresá un precio válido'); return; }
    if (rows.length < 2) { toast.error('El combo debe tener al menos 2 componentes'); return; }
    if (rows.some((r) => !r.productId || r.quantity < 1)) { toast.error('Completá todos los componentes'); return; }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      image: image.trim() || undefined,
      comboItems: rows.map((r) => ({
        productId: r.productId,
        variant: r.variant || undefined,
        color: r.color || undefined,
        quantity: r.quantity,
      })),
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateCombo(editingId, payload);
        toast.success('Combo actualizado');
      } else {
        await addCombo(payload);
        toast.success('Combo creado');
      }
      setFormOpen(false);
    } catch {
      toast.error('Error al guardar el combo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-foreground">Combos</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Kits armados con 2 o más productos. El precio es independiente del valor de sus componentes.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity shrink-0">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-10">Cargando combos...</p>
      ) : combos.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-10">Todavía no hay combos creados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => (
            <div key={combo.id} className={`rounded-lg border p-4 space-y-3 ${combo.active ? 'border-foreground' : 'border-accent'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{combo.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{combo.comboItems.length} componentes · Stock: {combo.stock}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(combo)} className="p-1.5 rounded hover:bg-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('¿Eliminar este combo?')) {
                        try { await deleteCombo(combo.id); toast.success('Combo eliminado'); } catch { toast.error('Error al eliminar'); }
                      }
                    }}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-body text-sm tabular-nums text-foreground font-medium">{formatPrice(combo.price)}</span>
              </div>

              {combo.comboItems.length > 0 && (
                <ul className="space-y-1">
                  {combo.comboItems.map((c) => (
                    <li key={c.id} className="font-body text-xs text-muted-foreground">
                      {c.productName}{c.variant || c.color ? ` (${[c.variant, c.color].filter(Boolean).join(' · ')})` : ''} — {c.quantity}u
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-accent">
                <span className="font-body text-xs text-muted-foreground">Activo en catálogo</span>
                <Switch
                  checked={combo.active}
                  onCheckedChange={async (checked) => {
                    try {
                      await updateCombo(combo.id, {
                        name: combo.name,
                        price: combo.price,
                        active: checked,
                        comboItems: combo.comboItems.map((c) => ({
                          productId: c.productId,
                          variant: c.variant,
                          color: c.color,
                          quantity: c.quantity,
                        })),
                      });
                      toast.success(checked ? 'Combo activado' : 'Combo desactivado');
                    } catch { toast.error('Error al actualizar'); }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) setFormOpen(false); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editingId ? 'Editar combo' : 'Crear combo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Combo Descanso Total"
                  className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Precio (manual)</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Qué incluye el combo..."
                className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
              />
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Imagen (URL)</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Componentes ({rows.length})</label>
              <ComponentPicker rows={rows} onChange={setRows} />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear combo'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCombos;