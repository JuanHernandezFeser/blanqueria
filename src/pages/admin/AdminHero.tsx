import { useState, useRef } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useHeroStore } from '@/stores/heroStore';
import type { HeroSlide, HeroSlideType } from '@/stores/heroStore';
import { api } from '@/services/api';
import { formatPrice } from '@/services/shippingService';
import { Pencil, Trash2, Plus, MoveUp, MoveDown, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminHero = () => {
  const products = useProductStore((s) => s.products);
  const { slides: heroSlides, addSlide, updateSlide, deleteSlide, reorderSlides } = useHeroStore();

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<HeroSlideType>('image');
  const [editOpen, setEditOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setImageFile(null);
    setPreview('');
    setTitle('');
    setSubtitle('');
    setVideoUrl('');
    setAddType('image');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAdd = async () => {
    if (addType === 'video') {
      if (!videoUrl.trim()) { toast.error('Ingresá una URL de video'); return; }
      setUploading(true);
      try {
        await addSlide({
          type: 'video',
          image: '',
          videoUrl: videoUrl.trim(),
          title: title || '',
          subtitle: subtitle || '',
        });
        toast.success('Slide de video agregado');
        setAddOpen(false);
        resetForm();
      } catch {
        toast.error('Error al agregar slide');
      } finally {
        setUploading(false);
      }
    } else {
      if (!imageFile) { toast.error('Seleccioná una imagen'); return; }
      setUploading(true);
      try {
        const { files } = await api.upload([imageFile]);
        await addSlide({
          type: 'image',
          image: files[0],
          title: title || '',
          subtitle: subtitle || '',
        });
        toast.success('Slide agregado');
        setAddOpen(false);
        resetForm();
      } catch {
        toast.error('Error al agregar slide');
      } finally {
        setUploading(false);
      }
    }
  };

  const openEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setPreview(slide.image);
    setTitle(slide.title || '');
    setSubtitle(slide.subtitle || '');
    setVideoUrl(slide.videoUrl || '');
    setImageFile(null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingSlide) return;
    setUploading(true);
    try {
      const data: Partial<HeroSlide> = {
        title: title || '',
        subtitle: subtitle || '',
      };
      if (editingSlide.type === 'video') {
        data.videoUrl = videoUrl.trim() || editingSlide.videoUrl;
        data.image = '';
      } else {
        if (imageFile) {
          const { files } = await api.upload([imageFile]);
          data.image = files[0];
        } else {
          data.image = editingSlide.image;
        }
        data.videoUrl = '';
      }
      await updateSlide(editingSlide.id, data);
      toast.success('Slide actualizado');
      setEditOpen(false);
      resetForm();
      setEditingSlide(null);
    } catch {
      toast.error('Error al actualizar slide');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-foreground">Hero Slides</h2>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetForm(); }}>
            <button onClick={() => { setAddType('image'); setAddOpen(true); }} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar slide al Hero</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Tipo</label>
                  <div className="flex gap-2">
                    <button onClick={() => setAddType('image')} className={`flex-1 rounded-md px-3 py-2 text-xs font-body font-medium transition-colors ${addType === 'image' ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-accent'}`}>
                      Imagen
                    </button>
                    <button onClick={() => setAddType('video')} className={`flex-1 rounded-md px-3 py-2 text-xs font-body font-medium transition-colors ${addType === 'video' ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-accent'}`}>
                      Video
                    </button>
                  </div>
                </div>
                {addType === 'video' ? (
                  <VideoFormContent
                    videoUrl={videoUrl}
                    title={title}
                    subtitle={subtitle}
                    uploading={uploading}
                    onVideoUrlChange={setVideoUrl}
                    onTitleChange={setTitle}
                    onSubtitleChange={setSubtitle}
                    onSubmit={handleAdd}
                    submitLabel={uploading ? 'Guardando...' : 'Agregar slide'}
                  />
                ) : (
                  <ImageFormContent
                    preview={preview}
                    title={title}
                    subtitle={subtitle}
                    uploading={uploading}
                    fileRef={fileRef}
                    onFileChange={handleFileChange}
                    onTitleChange={setTitle}
                    onSubtitleChange={setSubtitle}
                    onSubmit={handleAdd}
                    submitLabel={uploading ? 'Subiendo...' : 'Agregar slide'}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...heroSlides].sort((a, b) => a.order - b.order).map((slide, idx) => {
          const product = slide.productId ? products.find((p) => p.id === slide.productId) : null;
          return (
            <div key={slide.id} className="rounded-lg border border-accent overflow-hidden">
              <div className="aspect-[16/9] bg-muted relative group">
                {slide.type === 'video' ? (
                  <video src={slide.videoUrl} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={product ? (product.images?.[0] || product.image) : slide.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <span className="rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-body font-medium text-foreground flex items-center gap-1">
                    {slide.type === 'product' ? 'Producto' : slide.type === 'video' ? <><Video className="h-3 w-3" /> Video</> : 'Imagen'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-body text-sm font-medium text-foreground truncate">
                  {slide.title || (product?.name || 'Sin título')}
                </p>
                {slide.subtitle && (
                  <p className="font-body text-xs text-muted-foreground truncate">{slide.subtitle}</p>
                )}
                {product && (
                  <p className="font-body text-xs text-muted-foreground">Producto: {product.name}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-accent">
                  <div className="flex gap-1">
                    {slide.type !== 'product' && (
                      <button onClick={() => openEdit(slide)} className="p-1.5 rounded hover:bg-accent transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (confirm('¿Eliminar slide?')) try { await deleteSlide(slide.id); toast.success('Slide eliminado'); } catch { toast.error('Error al eliminar'); }
                      }}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => { if (idx > 0) try { await reorderSlides(idx, idx - 1); } catch { toast.error('Error al reordenar'); } }}
                      disabled={idx === 0}
                      className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-30"
                    >
                      <MoveUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={async () => { if (idx < heroSlides.length - 1) try { await reorderSlides(idx, idx + 1); } catch { toast.error('Error al reordenar'); } }}
                      disabled={idx === heroSlides.length - 1}
                      className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-30"
                    >
                      <MoveDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-accent p-6">
        <h3 className="font-body text-sm font-medium text-foreground mb-3">Agregar slide de producto</h3>
        <select
          onChange={async (e) => {
            if (!e.target.value) return;
            const product = products.find((p) => p.id === e.target.value);
            if (product) {
              try {
                await addSlide({ type: 'product', image: product.image, productId: product.id, title: product.name, subtitle: `${product.brand} · ${product.category}` });
                toast.success('Slide agregado');
              } catch { toast.error('Error al agregar slide'); }
            }
            e.target.value = '';
          }}
          value=""
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          <option value="">Seleccionar producto...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
          ))}
        </select>
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditingSlide(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {editingSlide?.type === 'video' ? (
              <VideoFormContent
                videoUrl={videoUrl}
                title={title}
                subtitle={subtitle}
                uploading={uploading}
                onVideoUrlChange={setVideoUrl}
                onTitleChange={setTitle}
                onSubtitleChange={setSubtitle}
                onSubmit={handleEdit}
                submitLabel={uploading ? 'Guardando...' : 'Guardar cambios'}
              />
            ) : (
              <ImageFormContent
                preview={preview}
                title={title}
                subtitle={subtitle}
                uploading={uploading}
                editing
                fileRef={fileRef}
                onFileChange={handleFileChange}
                onTitleChange={setTitle}
                onSubtitleChange={setSubtitle}
                onSubmit={handleEdit}
                submitLabel={uploading ? 'Subiendo...' : 'Guardar cambios'}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ImageFormContent({
  preview, title, subtitle, uploading, editing, fileRef,
  onFileChange, onTitleChange, onSubtitleChange, onSubmit, submitLabel,
}: {
  preview: string;
  title: string;
  subtitle: string;
  uploading: boolean;
  editing?: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Imagen {editing && <span className="normal-case tracking-normal text-muted-foreground/60">(dejá vacío para mantener la actual)</span>}
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-accent rounded-md p-6 text-center cursor-pointer hover:border-foreground/40 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <span className="font-body text-sm">Hacé clic para seleccionar una imagen</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </div>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Colección de verano"
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Descripción</label>
        <textarea
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="Ej: Sábanas de algodón egipcio"
          rows={3}
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={uploading}
        className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </>
  );
}

function VideoFormContent({
  videoUrl, title, subtitle, uploading,
  onVideoUrlChange, onTitleChange, onSubtitleChange, onSubmit, submitLabel,
}: {
  videoUrl: string;
  title: string;
  subtitle: string;
  uploading: boolean;
  onVideoUrlChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">URL del video</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          placeholder="https://ejemplo.com/video.mp4"
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        {videoUrl && (
          <video src={videoUrl} className="mt-2 max-h-40 w-full rounded object-contain bg-muted" controls />
        )}
      </div>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Colección de verano"
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>
      <div>
        <label className="block font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Descripción</label>
        <textarea
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="Ej: Sábanas de algodón egipcio"
          rows={3}
          className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={uploading}
        className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </>
  );
}

export default AdminHero;
