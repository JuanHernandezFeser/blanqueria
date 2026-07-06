import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  loading?: boolean;
  onSelect: (product: Product) => void;
  viewAllLink?: string;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const ProductCarousel = ({ title, products, loading, onSelect, viewAllLink = '/catalogo' }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval>>();
  const duplicated = [...products, ...products];
  const originalCount = products.length;
  const cardRef = useRef<HTMLDivElement>(null);

  const getStep = () => {
    if (cardRef.current) return cardRef.current.offsetWidth + 16;
    return 296;
  };

  const smoothScrollTo = useCallback((targetX: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const start = el.scrollLeft;
    const distance = targetX - start;
    if (Math.abs(distance) < 1) return;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = start + distance * easeOutQuart(progress);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const scrollRight = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    smoothScrollTo(el.scrollLeft + getStep());
  }, [smoothScrollTo]);

  const stopAutoScroll = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = undefined;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    if (products.length === 0 || loading) return;
    autoTimerRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const step = getStep();
      const threshold = originalCount * step;
      const nextPos = el.scrollLeft + step;

      if (nextPos >= threshold - 50) {
        el.scrollLeft = 0;
        smoothScrollTo(step);
      } else {
        smoothScrollTo(nextPos);
      }
    }, 4000);
  }, [products.length, originalCount, loading, stopAutoScroll, smoothScrollTo]);

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  const showArrow = products.length > 4;

  return (
    <section className="container py-16 md:py-20">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
        <Link to={viewAllLink} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Ver todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onMouseEnter={stopAutoScroll}
          onMouseLeave={startAutoScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
        >
          {loading ? <ProductSkeleton count={4} /> : products.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-8">No hay productos disponibles.</p>
          ) : (
            duplicated.map((p, i) => (
              <motion.div
                key={`${p.id}-${i}`}
                ref={i === 0 ? cardRef : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (i % originalCount) * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-[75vw] sm:w-[45vw] md:w-[260px] lg:w-[280px] flex-shrink-0 snap-start"
              >
                <ProductCard product={p} onSelect={onSelect} index={i % originalCount} />
              </motion.div>
            ))
          )}
        </div>

        {showArrow && (
          <button
            onClick={scrollRight}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 backdrop-blur-sm border border-accent p-2.5 text-foreground hover:bg-background transition-colors shadow-md"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
