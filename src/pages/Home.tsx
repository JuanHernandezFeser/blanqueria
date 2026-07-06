import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import HeroCarousel from '@/components/HeroCarousel';
import ProductDetail from '@/components/ProductDetail';
import CategoryCard from '@/components/CategoryCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';
import ProductCarousel from '@/components/shared/ProductCarousel';
import type { Product } from '@/data/products';
import { useState, useEffect } from 'react';

const Home = () => {
  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, []);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <section className="container py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-8">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? <ProductSkeleton count={5} showCategory /> : categories.map((cat, i) => (
            <CategoryCard key={cat.name} category={cat} index={i} />
          ))}
        </div>
      </section>

      <ProductCarousel
        title="Novedades"
        products={newArrivals}
        loading={loading}
        onSelect={setSelectedProduct}
        viewAllLink="/catalogo"
      />

      {featured.length > 0 && (
        <ProductCarousel
          title="Destacados"
          products={featured}
          loading={loading}
          onSelect={setSelectedProduct}
          viewAllLink="/catalogo"
        />
      )}

      <ProductDetail product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

export default Home;
