import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroStore } from '@/stores/heroStore';
import { useProductStore } from '@/stores/productStore';

const HeroCarousel = () => {
  const slides = useHeroStore((s) => s.slides);
  const products = useProductStore((s) => s.products);
  const [current, setCurrent] = useState(0);

  const navigate = useNavigate();
  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sortedSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % sortedSlides.length);
    }, 6000);
  }, [sortedSlides.length]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % sortedSlides.length);
    startTimer();
  }, [sortedSlides.length, startTimer]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + sortedSlides.length) % sortedSlides.length);
    startTimer();
  }, [sortedSlides.length, startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  if (sortedSlides.length === 0) return null;

  const slide = sortedSlides[current];

  const product = slide.type === 'product' && slide.productId
    ? products.find((p) => p.id === slide.productId)
    : null;

  return (
    <section
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Logo - visible on desktop only */}
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-1/4 -translate-x-1/2 z-20">
        <img src="/logo.png" alt="AIKEN" className="h-80 w-auto" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {product ? (
            <button
              onClick={() => navigate(`/producto/${product.id}`)}
              className="w-full bg-secondary flex items-center justify-center p-6 md:p-12 text-left min-h-[300px] md:min-h-[400px]"
            >
              <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto w-full">
                <div className="w-full md:w-1/2 aspect-square rounded-lg overflow-hidden bg-muted max-w-[300px] md:max-w-none">
                  <img
                    src={product.images?.[0] || product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    {product.brand}
                  </p>
                  <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-foreground leading-tight mb-3">
                    {slide.title || product.name}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground">
                    {slide.subtitle || product.description}
                  </p>
                </div>
              </div>
            </button>
          ) : slide.type === 'video' ? (
            <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] relative">
              <video
                src={slide.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-background/60 via-background/20 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-[55%] md:max-w-xl ml-auto mr-2 md:mr-0 bg-background/20 md:bg-background/30 backdrop-blur-md rounded-xl p-3 md:p-8"
                  >
                    {slide.title && (
                      <h1 className="font-display text-2xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-2 md:mb-3">
                        {slide.title}
                      </h1>
                    )}
                    {slide.subtitle && (
                      <p className="font-body text-xs md:text-lg text-foreground max-w-md leading-relaxed">
                        {slide.subtitle}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1]">
              <>
                <img
                  src={slide.image}
                  alt={slide.title || ''}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-background/60 via-background/20 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="max-w-[55%] md:max-w-xl ml-auto mr-2 md:mr-0 bg-background/20 md:bg-background/30 backdrop-blur-md rounded-xl p-3 md:p-8"
                    >
                      {slide.title && (
                        <h1 className="font-display text-2xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-2 md:mb-3">
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p className="font-body text-xs md:text-lg text-foreground max-w-md leading-relaxed">
                          {slide.subtitle}
                        </p>
                      )}
                    </motion.div>
                  </div>
                </div>
              </>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {sortedSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur-sm p-2.5 text-foreground hover:bg-background/80 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur-sm p-2.5 text-foreground hover:bg-background/80 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {sortedSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrent(i); startTimer(); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-foreground w-6' : 'bg-foreground/40 hover:bg-foreground/60'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroCarousel;
