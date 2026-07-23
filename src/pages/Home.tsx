import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCard from '@/components/CategoryCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';
import ProductCarousel from '@/components/shared/ProductCarousel';
import PaymentMethodsBar from '@/components/shared/PaymentMethodsBar';
import { useState, useEffect, useCallback, useRef } from 'react';

const Home = () => {
  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, []);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [categoryScrollEnded, setCategoryScrollEnded] = useState(false);
  const [categoryScrollStarted, setCategoryScrollStarted] = useState(false);
  const [catOverflows, setCatOverflows] = useState(false);

  const handleCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setCategoryScrollEnded(atEnd);
    setCategoryScrollStarted(el.scrollLeft > 0);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const check = () => setCatOverflows(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const featured = products.filter((p) => p.featured);

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <PaymentMethodsBar />

      <section className="container pt-8 md:pt-12 pb-0">

          <div className="relative">
          <div
            ref={categoryScrollRef}
            onScroll={handleCategoryScroll}
            className={`flex gap-8 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar px-4 md:px-0 ${
              catOverflows ? 'justify-start' : 'justify-center'
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex shrink-0 flex-col items-center gap-3 snap-start">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-accent" />
                  <div className="h-3 w-16 animate-pulse rounded bg-accent" />
                </div>
              ))
            ) : categories.map((cat, i) => (
              <CategoryCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
          {!categoryScrollEnded && (
            <div className="md:hidden absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
          )}
          {categoryScrollStarted && (
            <div className="md:hidden absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
          )}
        </div>
      </section>

      <ProductCarousel
        title="Novedades"
        products={newArrivals}
        loading={loading}
        viewAllLink="/catalogo"
        badgeContext="novedades"
      />

      {featured.length > 0 && (
        <ProductCarousel
          title="Destacados"
          products={featured}
          loading={loading}
          viewAllLink="/catalogo"
          badgeContext="destacados"
        />
      )}

    </div>
  );
};

export default Home;
