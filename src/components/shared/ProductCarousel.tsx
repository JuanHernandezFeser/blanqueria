import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  loading?: boolean;
  viewAllLink?: string;
  badgeContext?: 'novedades' | 'destacados' | 'catalogo';
}

const ProductCarousel = ({ title, products, loading, viewAllLink = '/catalogo', badgeContext }: ProductCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    loop: false,
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on('select', update);
    emblaApi.on('reInit', update);
    return () => {
      emblaApi.off('select', update);
      emblaApi.off('reInit', update);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const showArrows = products.length > 4;

  return (
    <section className="container pt-8 md:pt-12 pb-0">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
        <Link to={viewAllLink} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Ver todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4">
            {loading ? <ProductSkeleton count={4} /> : products.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground py-8">No hay productos disponibles.</p>
            ) : (
              products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[calc(50%-_8px)] md:w-[calc(33.333%-_10.667px)] xl:w-[calc(25%-_12px)]"
                >
                  <ProductCard product={p} index={i} badgeContext={badgeContext} />
                </div>
              ))
            )}
          </div>
        </div>

        {showArrows && (
          <>
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={`absolute -left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 backdrop-blur-sm border border-accent p-2.5 text-foreground hover:bg-background transition-colors shadow-md ${
                !canScrollPrev ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 backdrop-blur-sm border border-accent p-2.5 text-foreground hover:bg-background transition-colors shadow-md ${
                !canScrollNext ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
