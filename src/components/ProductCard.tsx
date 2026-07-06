import { type Product, getTotalStock } from '@/data/products';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/services/shippingService';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  index?: number;
}

const ProductCard = ({ product, onSelect, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const outOfStock = getTotalStock(product) <= 0;
  const inCart = items.some((i) => i.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="group cursor-pointer"
      onClick={() => onSelect(product)}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/5] mb-3">
        <img
          src={product.images?.[0] || product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.02] image-outline ${outOfStock ? 'opacity-50 grayscale' : ''}`}
          loading="lazy"
        />
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-destructive px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-destructive-foreground shadow-sm">
            Sin stock
          </span>
        )}
        {!outOfStock && inCart && (
          <span className="absolute top-3 left-3 bg-foreground px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-background flex items-center gap-1 shadow-sm">
            <ShoppingBag className="h-3 w-3" /> En carrito
          </span>
        )}
        {!outOfStock && !inCart && (
          <>
            {product.isNew && product.featured && (
              <span className="absolute top-3 left-3 bg-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Nuevo
              </span>
            )}
            {product.featured && !product.isNew && (
              <span className="absolute top-3 left-3 bg-amber-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Destacado
              </span>
            )}
            {product.isNew && !product.featured && (
              <span className="absolute top-3 left-3 bg-foreground px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-background shadow-sm">
                Nuevo
              </span>
            )}
          </>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">
          {product.brand}
        </p>
        <h3 className="font-body text-sm font-medium text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="font-body text-sm tabular-nums text-muted-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className={`mt-3 w-full rounded-md border py-2.5 text-xs font-medium uppercase tracking-wider transition-all duration-200 font-body ${
          outOfStock
            ? 'border-accent text-muted-foreground cursor-not-allowed opacity-50'
            : inCart
            ? 'border-foreground bg-foreground text-background hover:opacity-90'
            : 'border-accent text-foreground hover:bg-foreground hover:text-background hover:border-foreground'
        }`}
      >
        {outOfStock ? 'Sin stock' : inCart ? 'Agregar otra unidad' : 'Agregar al carrito'}
      </button>
    </motion.div>
  );
};

export default ProductCard;
