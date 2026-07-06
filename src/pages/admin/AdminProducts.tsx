import { useState, useRef, useMemo } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { type Product, variantStockKey, getTotalStock } from '@/data/products';
import { formatPrice } from '@/services/shippingService';
import SearchInput from '@/components/shared/SearchInput';
import TagChip from '@/components/shared/TagChip';
import { Pencil, Trash2, Plus, X, ChevronRight, ChevronLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/api';
import { toast } from 'sonner';

const PRODUCTS_PER_PAGE = 15;

const emptyForm = {
  name: '', description: '', brand: '', category: '', subcategory: '',
  price: 0, stock: 0, image: '', images: [] as string[], variants: [] as string[], colors: [] as string[],
  variantStock: {} as Record<string, number>,
  featured: false, isNew: false,
};

const AdminProducts = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const categories = useCategoryStore((s) => s.categories);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newVariant, setNewVariant] = useState('');
  const [newColor, setNewColor] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => { setForm({ ...emptyForm, category: categories[0]?.name || '' }); setEditProduct(null); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description, brand: p.brand, category: p.category,
      subcategory: p.subcategory || '', price: p.price, stock: p.stock,
      image: p.image, images: p.images || [], variants: p.variants || [], colors: p.colors || [],
      variantStock: p.variantStock || {},
      featured: p.featured || false, isNew: p.isNew || false,
    });
    setEditProduct(p);
    setShowForm(true);
  };

  const selectedCategoryObj = categories.find((c) => c.name === form.category);
  const hasVariantCombos = form.variants.length > 0 || form.colors.length > 0;

  const cleanVariantStock = (variants: string[], colors: string[], current: Record<string, number>) => {
    if (variants.length === 0 && colors.length === 0) return {};
    if (colors.length > 0 && variants.length === 0) {
      return Object.fromEntries(colors.map((c) => [variantStockKey(undefined, c), current[variantStockKey(undefined, c)] ?? 0]));
    }
    const keys = variants.flatMap((v) => colors.length > 0 ? colors.map((c) => variantStockKey(v, c)) : [variantStockKey(v)]);
    return Object.fromEntries(keys.map((k) => [k, current[k] ?? 0]));
  };

  const handleAddVariant = () => {
    if (!newVariant.trim() || form.variants.includes(newVariant.trim())) return;
    const next = [...form.variants, newVariant.trim()];
    setForm({ ...form, variants: next, variantStock: cleanVariantStock(next, form.colors, form.variantStock) });
    setNewVariant('');
  };

  const handleRemoveVariant = (v: string) => {
    const next = form.variants.filter((x) => x !== v);
    setForm({ ...form, variants: next, variantStock: cleanVariantStock(next, form.colors, form.variantStock) });
  };

  const handleAddColor = () => {
    if (!newColor.trim() || form.colors.includes(newColor.trim())) return;
    const next = [...form.colors, newColor.trim()];
    setForm({ ...form, colors: next, variantStock: cleanVariantStock(form.variants, next, form.variantStock) });
    setNewColor('');
  };

  const handleRemoveColor = (c: string) => {
    const next = form.colors.filter((x) => x !== c);
    setForm({ ...form, colors: next, variantStock: cleanVariantStock(form.variants, next, form.variantStock) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const { urls } = await api.upload(files);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
        image: prev.image || urls[0],
      }));
    } catch {
      toast.error('Error al subir imágenes');
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: newImages, image: newImages[0] || '' };
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || form.price <= 0) { toast.error('Completá todos los campos'); return; }
    if (form.images.length === 0 && !form.image) { toast.error('Cargá al menos una imagen'); return; }

    const computedStock = hasVariantCombos
      ? Object.values(form.variantStock).reduce((sum, s) => sum + s, 0)
      : form.stock;

    const data: Partial<Product> = {
      name: form.name, description: form.description, brand: form.brand,
      category: form.category, subcategory: form.subcategory || undefined,
      price: form.price, stock: computedStock,
      image: form.image || form.images[0],
      images: form.images,
      variants: form.variants,
      colors: form.colors,
      variantStock: form.variantStock,
      featured: form.featured, isNew: form.isNew,
    };
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data);
        toast.success('Producto actualizado');
      } else {
        await addProduct(data as Omit<Product, 'id'>);
        toast.success('Producto creado');
      }
      setShowForm(false);
    } catch { toast.error('Error al guardar el producto'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteProduct(id); toast.success('Producto eliminado'); } catch { toast.error('Error al eliminar'); }
  };

  const adminFiltered = useMemo(() => products.filter((p) =>
    !adminSearch || p.name.toLowerCase().includes(adminSearch.toLowerCase()) || p.brand.toLowerCase().includes(adminSearch.toLowerCase()) || p.category.toLowerCase().includes(adminSearch.toLowerCase())
  ), [products, adminSearch]);

  const totalPages = Math.ceil(adminFiltered.length / PRODUCTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginatedProducts = adminFiltered.slice((safePage - 1) * PRODUCTS_PER_PAGE, safePage * PRODUCTS_PER_PAGE);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="w-full sm:max-w-xs">
          <SearchInput value={adminSearch} onChange={(v) => { setAdminSearch(v); setCurrentPage(1); }} placeholder="Buscar productos..." />
        </div>
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-muted-foreground">{adminFiltered.length} productos</p>
          <button onClick={openNew} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> Nuevo Producto
          </button>
        </div>
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
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="border-b border-accent/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-body text-sm text-foreground truncate block">{p.name}</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {p.featured && <span className="inline-block rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-body font-medium leading-none">Destacado</span>}
                        {p.isNew && <span className="inline-block rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-body font-medium leading-none">Nuevo</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">{p.brand}</td>
                <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">
                  {p.category}
                  {p.subcategory && <span className="text-xs"> › {p.subcategory}</span>}
                </td>
                <td className="p-3 text-right font-body text-sm tabular-nums text-foreground">{formatPrice(p.price)}</td>
                <td className="p-3 text-right hidden sm:table-cell">
                  {(() => {
                    const total = getTotalStock(p);
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-body font-medium ${total > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {total > 0 ? `${total}` : 'Sin stock'}
                      </span>
                    );
                  })()}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded-md text-sm font-body transition-colors ${page === safePage ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-background max-w-lg max-h-[90vh] overflow-y-auto">
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
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                  {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {selectedCategoryObj && selectedCategoryObj.subcategories?.length > 0 && (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Subcategoría</label>
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                  <option value="">Sin subcategoría</option>
                  {selectedCategoryObj.subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className={hasVariantCombos ? '' : 'grid grid-cols-2 gap-3'}>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Precio</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              {!hasVariantCombos && (
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-accent text-foreground focus:ring-foreground"
                />
                <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Destacado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                  className="h-4 w-4 rounded border-accent text-foreground focus:ring-foreground"
                />
                <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Nuevo</span>
              </label>
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Imágenes</label>
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 rounded-full bg-background/80 backdrop-blur-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3 text-foreground" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-foreground/80 text-background text-[9px] px-1.5 py-0.5 rounded font-body">Principal</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full rounded-md border border-dashed border-accent px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <Upload className="h-4 w-4" />
                <span>Subir imágenes desde tu dispositivo</span>
              </button>
              {form.images.length === 0 && form.image && (
                <div className="mt-2 flex items-center gap-2 text-xs font-body text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="truncate">{form.image.substring(0, 50)}...</span>
                </div>
              )}
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Tamaños</label>
              {form.variants.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.variants.map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-body text-foreground">
                      {v}
                      <button onClick={() => handleRemoveVariant(v)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newVariant} onChange={(e) => setNewVariant(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }} placeholder="Ej: 1 Plaza, 2 Plazas, King..." className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                <button onClick={handleAddVariant} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Colores</label>
              {form.colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.colors.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-body text-foreground">
                      {c}
                      <button onClick={() => handleRemoveColor(c)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newColor} onChange={(e) => setNewColor(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }} placeholder="Ej: Blanco, Gris, Beige..." className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                <button onClick={handleAddColor} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {hasVariantCombos && (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Stock por combinación
                  <span className="normal-case tracking-normal text-muted-foreground/70 ml-1">
                    (Total: {Object.values(form.variantStock).reduce((s, v) => s + v, 0)})
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border border-accent p-3">
                  {(() => {
                    const variants = form.variants.length > 0 ? form.variants : [undefined];
                    const colors = form.colors.length > 0 ? form.colors : [undefined];
                    return variants.flatMap((v) =>
                      colors.map((c) => {
                        const key = variantStockKey(v, c);
                        const label = [v, c].filter(Boolean).join(' / ');
                        return (
                          <div key={key} className="flex items-center justify-between gap-3">
                            <span className="font-body text-xs text-foreground truncate flex-1">{label}</span>
                            <input
                              type="number"
                              min={0}
                              value={form.variantStock[key] ?? 0}
                              onChange={(e) => setForm((prev) => ({
                                ...prev,
                                variantStock: { ...prev.variantStock, [key]: Math.max(0, Number(e.target.value)) },
                              }))}
                              className="w-20 rounded-md border border-accent bg-background px-2 py-1.5 text-sm font-body text-foreground text-right focus:outline-none focus:ring-1 focus:ring-foreground"
                            />
                          </div>
                        );
                      })
                    );
                  })()}
                </div>
              </div>
            )}

            <button onClick={handleSave} className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProducts;
