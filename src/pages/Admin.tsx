import { useAuthStore } from '@/stores/authStore';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { CategoryItem } from '@/stores/categoryStore';
import { Navigate } from 'react-router-dom';
import { formatPrice } from '@/services/shippingService';
import type { Product } from '@/data/products';
import { mockOrders } from '@/data/orders';
import { useState, useRef, useMemo } from 'react';
import { Pencil, Trash2, Plus, X, ChevronRight, ChevronLeft, Upload, Image, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Admin = () => {
  const user = useAuthStore((s) => s.user);
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const { categories, addCategory, updateCategory, deleteCategory, addSubcategory, removeSubcategory } = useCategoryStore();
  const [tab, setTab] = useState<'products' | 'orders' | 'categories'>('products');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCatSubcategory, setNewCatSubcategory] = useState('');
  const [catSubcategories, setCatSubcategories] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 15;

  const emptyForm = {
    name: '', description: '', brand: '', category: categories[0]?.name || '', subcategory: '',
    price: 0, stock: 0, image: '', images: [] as string[], variants: [] as string[], colors: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);
  const [catForm, setCatForm] = useState({ name: '', image: '', description: '' });
  const [newVariant, setNewVariant] = useState('');
  const [newColor, setNewColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const openNew = () => { setForm(emptyForm); setEditProduct(null); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description, brand: p.brand, category: p.category,
      subcategory: p.subcategory || '', price: p.price, stock: p.stock,
      image: p.image, images: p.images || [], variants: p.variants || [], colors: p.colors || [],
    });
    setEditProduct(p);
    setShowForm(true);
  };

  const selectedCategoryObj = categories.find((c) => c.name === form.category);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, dataUrl],
          image: prev.image || dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: newImages, image: newImages[0] || '' };
    });
  };

  const handleAddVariant = () => {
    if (!newVariant.trim() || form.variants.includes(newVariant.trim())) return;
    setForm({ ...form, variants: [...form.variants, newVariant.trim()] });
    setNewVariant('');
  };

  const handleRemoveVariant = (v: string) => {
    setForm({ ...form, variants: form.variants.filter((x) => x !== v) });
  };

  const handleAddColor = () => {
    if (!newColor.trim() || form.colors.includes(newColor.trim())) return;
    setForm({ ...form, colors: [...form.colors, newColor.trim()] });
    setNewColor('');
  };

  const handleRemoveColor = (c: string) => {
    setForm({ ...form, colors: form.colors.filter((x) => x !== c) });
  };

  const handleSave = () => {
    if (!form.name || !form.brand || form.price <= 0) { toast.error('Completá todos los campos'); return; }
    if (form.images.length === 0 && !form.image) { toast.error('Cargá al menos una imagen'); return; }
    const data: Partial<Product> = {
      name: form.name, description: form.description, brand: form.brand,
      category: form.category, subcategory: form.subcategory || undefined,
      price: form.price, stock: form.stock,
      image: form.image || form.images[0],
      images: form.images.length > 0 ? form.images : undefined,
      variants: form.variants.length > 0 ? form.variants : undefined,
      colors: form.colors.length > 0 ? form.colors : undefined,
    };
    if (editProduct) {
      updateProduct(editProduct.id, data);
      toast.success('Producto actualizado');
    } else {
      addProduct(data as Omit<Product, 'id'>);
      toast.success('Producto creado');
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Producto eliminado');
  };

  const openCatNew = () => {
    setCatForm({ name: '', image: '', description: '' });
    setCatSubcategories([]);
    setNewCatSubcategory('');
    setEditingCategory(null);
    setShowCatForm(true);
  };

  const openCatEdit = (cat: CategoryItem) => {
    setCatForm({ name: cat.name, image: cat.image, description: cat.description });
    setEditingCategory(cat);
    setNewSubcategory('');
    setShowCatForm(true);
  };

  const handleSaveCategory = () => {
    if (!catForm.name.trim()) { toast.error('Ingresá un nombre para la categoría'); return; }
    if (editingCategory) {
      if (editingCategory.name !== catForm.name.trim()) {
        products.forEach((p) => {
          if (p.category === editingCategory.name) {
            updateProduct(p.id, { category: catForm.name.trim() });
          }
        });
      }
      updateCategory(editingCategory.name, {
        name: catForm.name.trim(),
        image: catForm.image || editingCategory.image,
        description: catForm.description,
      });
      toast.success('Categoría actualizada');
    } else {
      addCategory({
        name: catForm.name.trim(),
        image: catForm.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop',
        description: catForm.description || '',
        subcategories: catSubcategories,
      });
      toast.success('Categoría creada');
    }
    setShowCatForm(false);
    setEditingCategory(null);
    setCatSubcategories([]);
  };

  const handleDeleteCategory = (name: string) => {
    const hasProducts = products.some((p) => p.category === name);
    if (hasProducts) { toast.error('No se puede eliminar una categoría con productos asociados'); return; }
    deleteCategory(name);
    toast.success('Categoría eliminada');
  };

  const handleAddSubcategory = (categoryName: string) => {
    if (!newSubcategory.trim()) return;
    addSubcategory(categoryName, newSubcategory.trim());
    setNewSubcategory('');
    toast.success('Subcategoría agregada');
    const updated = useCategoryStore.getState().categories.find((c) => c.name === categoryName);
    if (updated) setEditingCategory(updated);
  };

  const handleRemoveSubcategory = (categoryName: string, sub: string) => {
    const hasProducts = products.some((p) => p.category === categoryName && p.subcategory === sub);
    if (hasProducts) { toast.error('No se puede eliminar una subcategoría con productos asociados'); return; }
    removeSubcategory(categoryName, sub);
    toast.success('Subcategoría eliminada');
    const updated = useCategoryStore.getState().categories.find((c) => c.name === categoryName);
    if (updated) setEditingCategory(updated);
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
        {(['products', 'categories', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`font-body text-sm px-4 py-2 rounded-md transition-colors ${tab === t ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
            {t === 'products' ? 'Productos' : t === 'categories' ? 'Categorías' : 'Pedidos'}
          </button>
        ))}
      </div>

      {tab === 'products' && (() => {
        const adminFiltered = products.filter((p) =>
          !adminSearch || p.name.toLowerCase().includes(adminSearch.toLowerCase()) || p.brand.toLowerCase().includes(adminSearch.toLowerCase()) || p.category.toLowerCase().includes(adminSearch.toLowerCase())
        );
        const totalPages = Math.ceil(adminFiltered.length / PRODUCTS_PER_PAGE);
        const safePage = Math.min(currentPage, totalPages || 1);
        const paginatedProducts = adminFiltered.slice((safePage - 1) * PRODUCTS_PER_PAGE, safePage * PRODUCTS_PER_PAGE);

        return (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={adminSearch}
                onChange={(e) => { setAdminSearch(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-md border border-accent bg-background pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground"
              />
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
                        <span className="font-body text-sm text-foreground truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">{p.brand}</td>
                    <td className="p-3 font-body text-sm text-muted-foreground hidden md:table-cell">
                      {p.category}
                      {p.subcategory && <span className="text-xs"> › {p.subcategory}</span>}
                    </td>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-md text-sm font-body transition-colors ${page === safePage ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </div>
          )}
        </>
        );
      })()}

      {tab === 'categories' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="font-body text-sm text-muted-foreground">{categories.length} categorías</p>
            <button onClick={openCatNew} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Nueva Categoría
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.name} className="rounded-lg border border-accent overflow-hidden">
                <div className="aspect-[16/9] bg-muted">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-body text-sm font-medium text-foreground">{c.name}</h3>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {products.filter((p) => p.category === c.name).length} productos
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openCatEdit(c)} className="p-1.5 rounded hover:bg-accent transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDeleteCategory(c.name)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {c.subcategories && c.subcategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.subcategories.map((sub) => (
                        <span key={sub} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-body text-foreground">
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
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

            {/* Image upload */}
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Imágenes</label>
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 rounded-full bg-background/80 backdrop-blur-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-foreground" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-foreground/80 text-background text-[9px] px-1.5 py-0.5 rounded font-body">Principal</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full rounded-md border border-dashed border-accent px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Subir imágenes desde tu dispositivo</span>
              </button>
              {form.images.length === 0 && form.image && (
                <div className="mt-2 flex items-center gap-2 text-xs font-body text-muted-foreground">
                  <Image className="h-3.5 w-3.5" />
                  <span className="truncate">{form.image.substring(0, 50)}...</span>
                </div>
              )}
            </div>

            {/* Sizes (variants) */}
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
                <input
                  value={newVariant}
                  onChange={(e) => setNewVariant(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }}
                  placeholder="Ej: 1 Plaza, 2 Plazas, King..."
                  className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <button onClick={handleAddVariant} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Colors */}
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
                <input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
                  placeholder="Ej: Blanco, Gris, Beige..."
                  className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <button onClick={handleAddColor} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button onClick={handleSave} className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category form dialog */}
      <Dialog open={showCatForm} onOpenChange={(open) => { setShowCatForm(open); if (!open) setEditingCategory(null); }}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
              <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Descripción</label>
              <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">URL de imagen</label>
              <input value={catForm.image} onChange={(e) => setCatForm({ ...catForm, image: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>

            {editingCategory ? (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Subcategorías</label>
                {editingCategory.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editingCategory.subcategories.map((sub) => (
                      <span key={sub} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-body text-foreground">
                        {sub}
                        <button onClick={() => handleRemoveSubcategory(editingCategory.name, sub)} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(editingCategory.name); } }}
                    placeholder="Nueva subcategoría..."
                    className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <button onClick={() => handleAddSubcategory(editingCategory.name)} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Subcategorías</label>
                {catSubcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {catSubcategories.map((sub) => (
                      <span key={sub} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-body text-foreground">
                        {sub}
                        <button onClick={() => setCatSubcategories(catSubcategories.filter((s) => s !== sub))} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newCatSubcategory}
                    onChange={(e) => setNewCatSubcategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCatSubcategory.trim() && !catSubcategories.includes(newCatSubcategory.trim())) {
                          setCatSubcategories([...catSubcategories, newCatSubcategory.trim()]);
                          setNewCatSubcategory('');
                        }
                      }
                    }}
                    placeholder="Nueva subcategoría..."
                    className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <button
                    onClick={() => {
                      if (newCatSubcategory.trim() && !catSubcategories.includes(newCatSubcategory.trim())) {
                        setCatSubcategories([...catSubcategories, newCatSubcategory.trim()]);
                        setNewCatSubcategory('');
                      }
                    }}
                    className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <button onClick={handleSaveCategory} className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
