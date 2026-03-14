import type { Product } from '@/data/products';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/services/shippingService';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  index?: number;
}

const ProductCard = ({ product, onSelect, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.02] image-outline"
          loading="lazy"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest text-foreground">
            Nuevo
          </span>
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
        className="mt-3 w-full rounded-md border border-accent py-2.5 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-200 hover:bg-foreground hover:text-background hover:border-foreground font-body"
      >
        Agregar al carrito
      </button>
    </motion.div>
  );
};

export default ProductCard;
