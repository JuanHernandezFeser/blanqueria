import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';
import type { Product } from '@/data/products';

interface AllProductsSectionProps {
  products: Product[];
  loading: boolean;
}

const AllProductsSection = ({ products, loading }: AllProductsSectionProps) => {
  if (loading) {
    return (
      <section className="container pt-8 md:pt-12 pb-0">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Todos los productos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="container pt-8 md:pt-12 pb-0">
      <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Todos los productos</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} badgeContext="catalogo" />
        ))}
      </div>
    </section>
  );
};

export default AllProductsSection;
