import { useState } from 'react';
import { useAmbienteStore } from '@/stores/ambienteStore';
import type { AmbienteItem } from '@/stores/ambienteStore';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminAmbientes = () => {
  const { ambientes, addAmbiente, updateAmbiente, deleteAmbiente } = useAmbienteStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AmbienteItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const openNew = () => {
    setForm({ name: '', description: '' });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (a: AmbienteItem) => {
    setForm({ name: a.name, description: a.description });
    setEditing(a);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Ingresá un nombre para el ambiente'); return; }
    try {
      if (editing) {
        await updateAmbiente(editing.name, { name: form.name.trim(), description: form.description });
        toast.success('Ambiente actualizado');
      } else {
        await addAmbiente({ name: form.name.trim(), description: form.description || '' });
        toast.success('Ambiente creado');
      }
      setShowForm(false);
      setEditing(null);
    } catch { toast.error('Error al guardar el ambiente'); }
  };

  const handleDelete = async (name: string) => {
    try { await deleteAmbiente(name); toast.success('Ambiente eliminado'); } catch { toast.error('Error al eliminar'); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="font-body text-sm text-muted-foreground">{ambientes.length} ambientes</p>
        <button onClick={openNew} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Nuevo Ambiente
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ambientes.map((a) => (
          <div key={a.name} className="rounded-lg border border-accent overflow-hidden p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{a.name}</h3>
                <p className="font-body text-xs text-muted-foreground mt-0.5">{a.description}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-accent transition-colors">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(a.name)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing ? 'Editar Ambiente' : 'Nuevo Ambiente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Descripción</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <button onClick={handleSave} className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              {editing ? 'Guardar Cambios' : 'Crear Ambiente'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAmbientes;
