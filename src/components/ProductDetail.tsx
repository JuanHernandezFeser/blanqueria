import { type Product, getTotalStock, getVariantStock } from '@/data/products';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { formatPrice, getDiscountedPrice } from '@/services/shippingService';
import ShippingCalculator from '@/components/ShippingCalculator';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QuantitySelector from '@/components/shared/QuantitySelector';
import { ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useProductStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const discountPercentage = useBankConfigStore((s) => s.config.discountPercentage);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = products.find((p) => p.id === id) ?? null;

  if (!product) {
    return (
      <div className="container py-8 md:py-12">
        <p className="font-body text-muted-foreground">Producto no encontrado.</p>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const totalStock = getTotalStock(product);
  const outOfStock = totalStock <= 0;
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const hasVariants = product.variants && product.variants.length > 0;
  const variantRequired = hasVariants && !selectedVariant;

  const hasColors = product.colors && product.colors.length > 0;
  const colorRequired = hasColors && !selectedColor;

  const hasVariantStockEntries = product.variantStock && Object.keys(product.variantStock).length > 0;
  const selectedComboStock = getVariantStock(product, selectedVariant, selectedColor);
  const selectedComboOutOfStock = hasVariantStockEntries && !variantRequired && !colorRequired && selectedComboStock <= 0;

  const maxQuantity = hasVariantStockEntries && (selectedVariant || selectedColor)
    ? selectedComboStock
    : totalStock;
  const atStockLimit = maxQuantity > 0 && quantity >= maxQuantity;

  const isVariantAvailable = (variant: string): boolean => {
    if (!hasVariantStockEntries) return product.stock > 0;
    if (hasColors) {
      return product.colors!.some((c) => getVariantStock(product, variant, c) > 0);
    }
    return getVariantStock(product, variant) > 0;
  };

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

  const canAdd = !outOfStock && !variantRequired && !colorRequired && !selectedComboOutOfStock && !(inCart && atStockLimit);

  return (
    <div className="min-h-screen">
      <div className="container py-6 md:py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_520px] gap-8">
          {/* Left column: image + thumbnail carousel */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Main image */}
            <div className="relative w-full max-h-[50vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={allImages[currentImageIndex]}
                alt={product.name}
                className="max-h-[50vh] w-full object-contain image-outline"
              />
            </div>

            {/* Thumbnail carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={prevImage}
                  className="shrink-0 rounded-full bg-background border border-border p-1.5 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <div className="flex gap-2 overflow-x-auto flex-1 justify-center">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                        idx === currentImageIndex
                          ? 'border-foreground opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={nextImage}
                  className="shrink-0 rounded-full bg-background border border-border p-1.5 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Right column: product details */}
          <div className="w-full lg:w-[520px] shrink-0 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">{product.brand}</p>
              <h1 className="font-display text-3xl lg:text-4xl text-foreground leading-tight mt-1">{product.name}</h1>
            </div>
            <div className="space-y-1">
              <p className="font-body text-2xl tabular-nums text-foreground">{formatPrice(product.price)}</p>
              {discountPercentage > 0 && (
                <p className="font-body text-lg tabular-nums text-gold font-medium">
                  {formatPrice(getDiscountedPrice(product.price, discountPercentage))}<span className="ml-2">transferencia / efectivo</span>
                </p>
              )}
            </div>

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
                onIncrease={() => setQuantity(q => Math.min(q + 1, Math.max(maxQuantity, 1)))}
                size="md"
              />
            </div>

            {(variantRequired || colorRequired) && (
              <p data-testid="variant-error" className="font-body text-xs text-destructive">
                {variantRequired && colorRequired
                  ? 'Seleccioná un tamaño y un color para continuar'
                  : variantRequired
                  ? 'Seleccioná un tamaño para continuar'
                  : 'Seleccioná un color para continuar'}
              </p>
            )}

            {atStockLimit && !variantRequired && !colorRequired && !selectedComboOutOfStock && (
              <p data-testid="stock-limit-error" className="font-body text-xs text-destructive">
                Solo hay {maxQuantity} disponibles. No podés agregar más unidades.
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
              className={`w-full rounded-md py-3.5 text-xs font-medium uppercase tracking-wider transition-all duration-200 font-body ${
                !canAdd
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : inCart
                  ? 'bg-gold text-gold-foreground hover:opacity-90'
                  : 'border border-gold text-gold hover:bg-gold hover:text-gold-foreground'
              }`}
            >
              {outOfStock
                ? 'Sin stock'
                : selectedComboOutOfStock
                ? 'Sin stock en esta combinación'
                : variantRequired || colorRequired
                ? 'Seleccioná las opciones'
                : inCart && atStockLimit
                ? 'Stock máximo en carrito'
                : inCart
                ? 'Agregar más al carrito'
                : 'Agregar al carrito'}
            </button>

            {inCart && (
              <button
                onClick={() => navigate('/carrito')}
                className="w-full rounded-md border border-accent py-3.5 text-xs font-medium uppercase tracking-wider text-foreground hover:bg-muted transition-colors font-body"
              >
                Ir al carrito
              </button>
            )}

            <div className="pt-2">
              <ShippingCalculator />
            </div>

            <div className="pt-2 space-y-2">
              <p data-testid="stock-info" className="font-body text-xs text-muted-foreground">
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
      </div>
    </div>
  );
};

export default ProductDetail;
