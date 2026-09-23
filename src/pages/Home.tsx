import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useSpecialStore } from '@/stores/specialStore';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCard from '@/components/CategoryCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';
import ProductCarousel from '@/components/shared/ProductCarousel';
import PaymentMethodsBar from '@/components/shared/PaymentMethodsBar';
import ShippingBanner from '@/components/shared/ShippingBanner';
import ProductPhotoMarquee from '@/components/shared/ProductPhotoMarquee';
import StaticBanner from '@/components/shared/StaticBanner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { compareByName } from '@/lib/helpers';

const CATEGORY_ITEM_WIDTH = 112;
const CATEGORY_GAP = 24;
const CATEGORY_SCROLL_STEP = (CATEGORY_ITEM_WIDTH + CATEGORY_GAP) * 3;

const Home = () => {
  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const specials = useSpecialStore((s) => s.specials);
  const fetchSpecials = useSpecialStore((s) => s.fetchSpecials);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecials();
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, []);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [categoryScrollEnded, setCategoryScrollEnded] = useState(false);
  const [categoryScrollStarted, setCategoryScrollStarted] = useState(false);
  const [catOverflows, setCatOverflows] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setCategoryScrollEnded(atEnd);
    setCategoryScrollStarted(!atStart);
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }, []);

  const animateCategoryScroll = useCallback((target: number, duration = 350) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const start = el.scrollLeft;
    const delta = target - start;
    if (delta === 0) return;
    const startTime = performance.now();
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      el.scrollLeft = start + delta * easeOutQuad(t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const scrollCategoriesBy = useCallback((direction: 1 | -1) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.min(Math.max(el.scrollLeft + direction * CATEGORY_SCROLL_STEP, 0), max);
    animateCategoryScroll(target);
  }, [animateCategoryScroll]);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const check = () => {
      const overflows = el.scrollWidth > el.clientWidth;
      setCatOverflows(overflows);
      if (overflows) handleCategoryScroll();
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [categories.length, loading, handleCategoryScroll]);

  const newArrivals = products.filter((p) => p.isNew).sort(compareByName).slice(0, 6);
  const featured = products.filter((p) => p.featured).sort(compareByName);

  const activeSpecial = specials.find((s) => s.active);
  const specialProducts = activeSpecial
    ? activeSpecial.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : [];

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <PaymentMethodsBar />

      <section className="container pt-8 md:pt-12 pb-0">

          <div className="relative">
          <div
            ref={categoryScrollRef}
            onScroll={handleCategoryScroll}
            className={`flex gap-6 overflow-x-auto py-2 snap-x snap-proximity no-scrollbar px-4 md:px-0 ${
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
            ) : categories.map((cat) => (
              <CategoryCard key={cat.name} category={cat} />
            ))}
          </div>
          {catOverflows && canScrollLeft && (
            <button
              type="button"
              aria-label="Ver categorías anteriores"
              onClick={() => scrollCategoriesBy(-1)}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {catOverflows && canScrollRight && (
            <button
              type="button"
              aria-label="Ver más categorías"
              onClick={() => scrollCategoriesBy(1)}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {!categoryScrollEnded && (
            <div className="md:hidden absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
          )}
          {categoryScrollStarted && (
            <div className="md:hidden absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
          )}
        </div>
      </section>

      <ProductPhotoMarquee />

      {activeSpecial && specialProducts.length > 0 && (
        <ProductCarousel
          title={activeSpecial.title}
          products={specialProducts}
          loading={loading}
          badgeContext="destacados"
        />
      )}

      <ShippingBanner />

      {featured.length > 0 && (
        <ProductCarousel
          title="Destacados"
          products={featured}
          loading={loading}
          viewAllLink="/catalogo"
          badgeContext="destacados"
        />
      )}

      <StaticBanner>Envíos dentro de Argentina, a cargo de Correo Argentino</StaticBanner>

      <ProductCarousel
        title="Novedades"
        products={newArrivals}
        loading={loading}
        viewAllLink="/catalogo"
        badgeContext="novedades"
      />

    </div>
  );
};

export default Home;
