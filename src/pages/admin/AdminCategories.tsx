import { useState } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { CategoryItem } from '@/stores/categoryStore';
import { Pencil, Trash2, Plus, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminCategories = () => {
  const products = useProductStore((s) => s.products);
  const { categories, addCategory, updateCategory, deleteCategory, addSubcategory, removeSubcategory } = useCategoryStore();
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCatSubcategory, setNewCatSubcategory] = useState('');
  const [catSubcategories, setCatSubcategories] = useState<string[]>([]);

  const openCatNew = () => {
    setCatForm({ name: '', description: '' });
    setCatSubcategories([]);
    setNewCatSubcategory('');
    setEditingCategory(null);
    setShowCatForm(true);
  };

  const openCatEdit = (cat: CategoryItem) => {
    setCatForm({ name: cat.name, description: cat.description });
    setEditingCategory(cat);
    setNewSubcategory('');
    setShowCatForm(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) { toast.error('Ingresá un nombre para la categoría'); return; }
    try {
      if (editingCategory) {
        if (editingCategory.name !== catForm.name.trim()) {
          for (const p of products) {
            if (p.category === editingCategory.name) {
              await useProductStore.getState().updateProduct(p.id, { category: catForm.name.trim() });
            }
          }
        }
        await updateCategory(editingCategory.name, {
          name: catForm.name.trim(),
          description: catForm.description,
        });
        toast.success('Categoría actualizada');
      } else {
        await addCategory({
          name: catForm.name.trim(),
          description: catForm.description || '',
          subcategories: catSubcategories,
        });
        toast.success('Categoría creada');
      }
      setShowCatForm(false);
      setEditingCategory(null);
      setCatSubcategories([]);
    } catch { toast.error('Error al guardar la categoría'); }
  };

  const handleDeleteCategory = async (name: string) => {
    const hasProducts = products.some((p) => p.category === name);
    if (hasProducts) { toast.error('No se puede eliminar una categoría con productos asociados'); return; }
    try { await deleteCategory(name); toast.success('Categoría eliminada'); } catch { toast.error('Error al eliminar'); }
  };

  const handleAddSubcategory = async (categoryName: string) => {
    if (!newSubcategory.trim()) return;
    try {
      await addSubcategory(categoryName, newSubcategory.trim());
      setNewSubcategory('');
      toast.success('Subcategoría agregada');
      const updated = useCategoryStore.getState().categories.find((c) => c.name === categoryName);
      if (updated) setEditingCategory(updated);
    } catch { toast.error('Error al agregar subcategoría'); }
  };

  const handleRemoveSubcategory = async (categoryName: string, sub: string) => {
    const hasProducts = products.some((p) => p.category === categoryName && p.subcategory === sub);
    if (hasProducts) { toast.error('No se puede eliminar una subcategoría con productos asociados'); return; }
    try {
      await removeSubcategory(categoryName, sub);
      toast.success('Subcategoría eliminada');
      const updated = useCategoryStore.getState().categories.find((c) => c.name === categoryName);
      if (updated) setEditingCategory(updated);
    } catch { toast.error('Error al eliminar subcategoría'); }
  };

  return (
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

            {editingCategory ? (
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Subcategorías</label>
                {(editingCategory.subcategories?.length ?? 0) > 0 && (
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
    </>
  );
};

export default AdminCategories;
