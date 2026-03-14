import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProductStore } from '@/stores/productStore';
import { categories } from '@/data/products';
import { formatPrice } from '@/services/shippingService';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import type { Product } from '@/data/products';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  const products = useProductStore((s) => s.products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="container py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.1]">
              El arte de descansar bien.
            </h1>
            <p className="mt-5 font-body text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
              Textiles de hogar de primera calidad. Algodón egipcio, lino natural y acabados artesanales.
            </p>
            <Link
              to="/catalogo"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-background transition-opacity duration-200 hover:opacity-90 font-body"
            >
              Explorar Colección
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-8">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                to={`/catalogo?category=${encodeURIComponent(cat.name)}`}
                className="group block"
              >
                <div className="aspect-[4/5] rounded-lg overflow-hidden bg-muted mb-3">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] image-outline"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-body text-sm font-medium text-foreground">{cat.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{cat.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Novedades</h2>
          <Link to="/catalogo" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Ver todo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {newArrivals.map((p, i) => (
            <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} index={i} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="container py-16 md:py-20">
        <div className="rounded-lg bg-secondary p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-lg">
            <h2 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
              Colección Otoño 2026
            </h2>
            <p className="mt-3 font-body text-sm text-muted-foreground leading-relaxed">
              Descubrí nuestra nueva colección de temporada. Fibras naturales, colores tierra y la calidez que tu hogar necesita.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="rounded-md border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-200 hover:bg-foreground hover:text-background font-body whitespace-nowrap"
          >
            Ver Colección
          </Link>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-8">Destacados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} index={i} />
            ))}
          </div>
        </section>
      )}

      <ProductDetail product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

export default Home;
