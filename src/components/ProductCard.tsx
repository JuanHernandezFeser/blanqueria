import { useState, useRef, useCallback } from 'react';
import { type Product, getTotalStock } from '@/data/products';
import { useCartStore } from '@/stores/cartStore';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import { formatPrice, getDiscountedPrice } from '@/services/shippingService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index?: number;
  badgeContext?: 'novedades' | 'destacados' | 'catalogo';
}

const ProductCard = ({ product, index = 0, badgeContext = 'catalogo' }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const navigate = useNavigate();
  const discountPercentage = useBankConfigStore((s) => s.config.discountPercentage);

  const allImages = product.images?.length ? product.images : [product.image];
  const hasMultipleImages = allImages.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDelta.current = delta;
    if (Math.abs(delta) > 5) {
      isSwiping.current = true;
    }
  }, [hasMultipleImages]);

  const handleTouchEnd = useCallback(() => {
    if (!hasMultipleImages || !isSwiping.current) return;
    const threshold = 30;
    if (touchDelta.current < -threshold && activeIndex < allImages.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (touchDelta.current > threshold && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  }, [hasMultipleImages, activeIndex, allImages.length]);

  const outOfStock = getTotalStock(product) <= 0;
  const inCart = items.some((i) => i.product.id === product.id);
  const hasDiscount = discountPercentage > 0;
  const discountedPrice = getDiscountedPrice(product.price, discountPercentage);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
  };

  const badge = (() => {
    if (outOfStock) return { text: 'Sin stock', className: 'bg-destructive text-destructive-foreground', icon: null };
    if (inCart) return { text: 'En carrito', className: 'bg-foreground text-background', icon: <ShoppingBag className="h-3 w-3" /> };

    if (badgeContext === 'novedades') {
      if (!product.isNew) return null;
      return { text: 'Nuevo', className: 'bg-emerald-600 text-white', icon: null };
    }

    if (badgeContext === 'destacados') {
      if (!product.featured) return null;
      return { text: 'Destacado', className: 'bg-amber-600 text-white', icon: null };
    }

    if (product.featured) return { text: 'Destacado', className: 'bg-amber-600 text-white', icon: null };
    if (product.isNew) return { text: 'Nuevo', className: 'bg-emerald-600 text-white', icon: null };

    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="group cursor-pointer flex flex-col h-full"
      onClick={() => navigate(`/producto/${product.id}`)}
      data-testid="product-card"
    >
      <div
        className="relative overflow-hidden rounded-lg bg-muted aspect-[4/5] mb-3"
        onMouseEnter={() => hasMultipleImages && setActiveIndex(1)}
        onMouseLeave={() => hasMultipleImages && setActiveIndex(0)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {allImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${product.name} ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover image-outline ${
              i === 0
                ? `transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.02] ${
                    outOfStock ? 'opacity-50 grayscale' : 'opacity-100'
                  }`
                : `transition-opacity duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                    i === activeIndex ? 'opacity-100' : 'opacity-0'
                  } ${outOfStock ? 'grayscale' : ''}`
            }`}
            loading="lazy"
          />
        ))}
        {badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1 z-10 ${badge.className}`}>
            {badge.icon}{badge.icon && ' '}{badge.text}
          </span>
        )}
        {hasMultipleImages && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm z-10 md:hidden">
            {activeIndex + 1}/{allImages.length}
          </span>
        )}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {allImages.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'bg-white scale-110' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="space-y-1 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">
          {product.brand}
        </p>
        <h3 className="font-body text-sm font-medium text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="space-y-0.5">
          <p className="font-body text-sm tabular-nums text-muted-foreground">
            {formatPrice(product.price)}
          </p>
          {hasDiscount && (
            <p className="font-body text-xs tabular-nums text-gold font-medium">
              {formatPrice(discountedPrice)}<span className="ml-2">transferencia / efectivo</span>
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className={`mt-3 w-full rounded-md border py-2.5 text-xs font-medium uppercase tracking-wider transition-all duration-200 font-body ${
          outOfStock
            ? 'border-accent text-muted-foreground cursor-not-allowed opacity-50'
            : inCart
            ? 'border-gold bg-gold text-gold-foreground hover:opacity-90'
            : 'border-gold text-gold hover:bg-gold hover:text-gold-foreground'
        }`}
      >
        {outOfStock ? 'Sin stock' : inCart ? 'Agregar otra unidad' : 'Agregar al carrito'}
      </button>
    </motion.div>
  );
};

export default ProductCard;
