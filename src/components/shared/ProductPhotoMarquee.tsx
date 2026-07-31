import { useEffect, useMemo, useRef, useState } from 'react';
import { useProductStore } from '@/stores/productStore';

const GAP = 16;
const SPEED = 90;

const ProductPhotoMarquee = () => {
  const products = useProductStore((s) => s.products);

  const photos = useMemo(() => {
    const seen = new Set<string>();
    const all: string[] = [];
    for (const p of products) {
      const urls = p.images && p.images.length > 0 ? p.images : [p.image];
      for (const url of urls) {
        if (url && !seen.has(url)) {
          seen.add(url);
          all.push(url);
        }
      }
    }
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [products]);

  const firstCopyRef = useRef<HTMLDivElement>(null);
  const [copyWidth, setCopyWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const el = firstCopyRef.current;
    if (!el) return;
    const update = () => {
      setCopyWidth(el.getBoundingClientRect().width);
      setViewportWidth(window.innerWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [photos]);

  if (photos.length === 0) return null;

  let copies = copyWidth > 0
    ? Math.ceil((viewportWidth + GAP) / (copyWidth + GAP))
    : 1;
  if (copies % 2 !== 0) copies += 1;
  copies = Math.max(2, copies);

  const duration = copyWidth > 0
    ? (copyWidth * copies) / 2 / SPEED
    : 30;

  return (
    <section className="container pt-8 md:pt-12 pb-0">
      <div className="overflow-hidden">
        <div
          className="flex w-max animate-marquee"
          style={{ animationDuration: `${duration}s` }}
        >
          {Array.from({ length: copies }).map((_, c) => (
            <div
              key={c}
              ref={c === 0 ? firstCopyRef : undefined}
              aria-hidden={c > 0}
              className="flex items-center gap-4 pr-4"
            >
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="h-36 md:h-44 w-auto shrink-0 aspect-square rounded-lg object-cover image-outline"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductPhotoMarquee;
