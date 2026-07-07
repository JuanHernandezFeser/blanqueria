import { type Product, getTotalStock, getVariantStock } from '@/data/products';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/services/shippingService';
import ShippingCalculator from '@/components/ShippingCalculator';
import { useState } from 'react';
import { toast } from 'sonner';
import QuantitySelector from '@/components/shared/QuantitySelector';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, open, onClose }: ProductDetailProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const totalStock = getTotalStock(product);
  const outOfStock = totalStock <= 0;
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const hasVariants = product.variants && product.variants.length > 0;
  const variantRequired = hasVariants && !selectedVariant;

  const hasColors = product.colors && product.colors.length > 0;
  const colorRequired = hasColors && !selectedColor;

  // Compute stock for the selected combo
  const hasVariantStockEntries = product.variantStock && Object.keys(product.variantStock).length > 0;
  const selectedComboStock = getVariantStock(product, selectedVariant, selectedColor);
  const selectedComboOutOfStock = hasVariantStockEntries && !variantRequired && !colorRequired && selectedComboStock <= 0;

  // Check if a specific variant has any stock (across all colors)
  const isVariantAvailable = (variant: string): boolean => {
    if (!hasVariantStockEntries) return product.stock > 0;
    if (hasColors) {
      return product.colors!.some((c) => getVariantStock(product, variant, c) > 0);
    }
    return getVariantStock(product, variant) > 0;
  };

  // Check if a specific color has any stock (across all variants, or for the selected variant)
  const isColorAvailable = (color: string): boolean => {
    if (!hasVariantStockEntries) return product.stock > 0;
    if (selectedVariant) {
      return getVariantStock(product, selectedVariant, color) > 0;
    }
    if (hasVariants) {
      return product.variants!.some((v) => getVariantStock(product, v, color) > 0);
    }
    return getVariantStock(product, undefined, color) > 0;
  };

  const handleAdd = () => {
    if (outOfStock || variantRequired || colorRequired || selectedComboOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariant);
    }
    toast.success(`${product.name} agregado al carrito`);
    setQuantity(1);
  };

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % allImages.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + allImages.length) % allImages.length);

  const canAdd = !outOfStock && !variantRequired && !colorRequired && !selectedComboOutOfStock;

  return (
    <Sheet open={open} onOpenChange={() => { onClose(); setCurrentImageIndex(0); setSelectedVariant(undefined); setSelectedColor(undefined); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background p-0">
        <div className="flex flex-col">
          <div className="relative aspect-[4/5] w-full bg-muted">
            <img src={allImages[currentImageIndex]} alt={product.name} className="h-full w-full object-cover image-outline" />
            {allImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors">
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors">
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-foreground scale-125' : 'bg-foreground/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
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

            {hasVariants && (
              <div className="space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Tamaño</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants!.map((v) => {
                    const available = !outOfStock && isVariantAvailable(v);
                    return (
                      <button
                        key={v}
                        onClick={() => available && setSelectedVariant(v)}
                        disabled={!available}
                        className={`rounded-md border px-4 py-2 text-xs font-body transition-all duration-200 ${
                          !available
                            ? 'border-accent text-muted-foreground/50 cursor-not-allowed line-through'
                            : selectedVariant === v
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-accent text-foreground hover:border-foreground'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasColors && (
              <div className="space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors!.map((c) => {
                    const available = !outOfStock && isColorAvailable(c);
                    return (
                      <button
                        key={c}
                        onClick={() => available && setSelectedColor(c)}
                        disabled={!available}
                        className={`rounded-md border px-4 py-2 text-xs font-body transition-all duration-200 ${
                          !available
                            ? 'border-accent text-muted-foreground/50 cursor-not-allowed line-through'
                            : selectedColor === c
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-accent text-foreground hover:border-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Cantidad</p>
              <QuantitySelector
                quantity={quantity}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrease={() => setQuantity(quantity + 1)}
                size="md"
              />
            </div>

            {(variantRequired || colorRequired) && (
              <p className="font-body text-xs text-destructive">
                {variantRequired && colorRequired
                  ? 'Seleccioná un tamaño y un color para continuar'
                  : variantRequired
                  ? 'Seleccioná un tamaño para continuar'
                  : 'Seleccioná un color para continuar'}
              </p>
            )}

            {selectedComboOutOfStock && (
              <p className="font-body text-xs text-destructive">
                Esta combinación no tiene stock disponible
              </p>
            )}

            <button
              onClick={handleAdd}
              disabled={!canAdd}
              data-testid="add-to-cart-detail"
              className={`w-full rounded-md py-3.5 text-xs font-medium uppercase tracking-wider transition-opacity duration-200 font-body ${
                !canAdd
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-foreground text-background hover:opacity-90'
              }`}
            >
              {outOfStock
                ? 'Sin stock'
                : selectedComboOutOfStock
                ? 'Sin stock en esta combinación'
                : variantRequired || colorRequired
                ? 'Seleccioná las opciones'
                : inCart
                ? 'Agregar más al carrito'
                : 'Agregar al carrito'}
            </button>

            <div className="pt-2">
              <ShippingCalculator />
            </div>

            <div className="pt-2 space-y-2">
              <p className="font-body text-xs text-muted-foreground">
                Stock: {hasVariantStockEntries && (selectedVariant || selectedColor)
                  ? `${selectedComboStock} disponibles para esta combinación`
                  : totalStock > 0
                  ? `${totalStock} disponibles`
                  : 'Sin stock'}
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