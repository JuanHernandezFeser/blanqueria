import type { Product } from '@/data/products';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/services/shippingService';
import ShippingCalculator from '@/components/ShippingCalculator';
import { useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, open, onClose }: ProductDetailProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const outOfStock = product.stock <= 0;
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const handleAdd = () => {
    if (outOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariant);
    }
    toast.success(`${product.name} agregado al carrito`);
    setQuantity(1);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background p-0">
        <div className="flex flex-col">
          <div className="aspect-[4/5] w-full bg-muted">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover image-outline" />
          </div>
          <div className="p-6 space-y-5">
            <SheetHeader className="text-left p-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">{product.brand}</p>
              <SheetTitle className="font-display text-2xl text-foreground leading-tight">{product.name}</SheetTitle>
            </SheetHeader>
            <p className="font-body text-xl tabular-nums text-foreground">{formatPrice(product.price)}</p>

            {inCart && (
              <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2.5">
                <ShoppingBag className="h-4 w-4 text-foreground" />
                <p className="font-body text-sm text-foreground">
                  Ya tenés <span className="font-medium">{cartItem.quantity}</span> en tu carrito
                </p>
              </div>
            )}

            <p className="font-body text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Tamaño</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-md border px-4 py-2 text-xs font-body transition-all duration-200 ${
                        selectedVariant === v
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-accent text-foreground hover:border-foreground'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Cantidad</p>
              <div className="flex items-center gap-2 border border-accent rounded-md">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-accent transition-colors rounded-l-md">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-body text-sm tabular-nums w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-accent transition-colors rounded-r-md">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`w-full rounded-md py-3.5 text-xs font-medium uppercase tracking-wider transition-opacity duration-200 font-body ${
                outOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-foreground text-background hover:opacity-90'
              }`}
            >
              {outOfStock ? 'Sin stock' : inCart ? 'Agregar más al carrito' : 'Agregar al carrito'}
            </button>

            <div className="pt-2">
              <ShippingCalculator />
            </div>

            <div className="pt-2 space-y-2">
              <p className="font-body text-xs text-muted-foreground">
                Stock: {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Categoría: {product.category}
                {product.subcategory && ` › ${product.subcategory}`}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetail;
