import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { categories, brands, type Category } from '@/data/products';
import type { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';

const Catalog = () => {
  const products = useProductStore((s) => s.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>(
    (searchParams.get('category') as Category) || ''
  );
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !p.brand.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (inStockOnly && p.stock <= 0) return false;
      return true;
    });
  }, [products, debouncedSearch, selectedCategory, selectedBrand, priceRange, inStockOnly]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange([0, 100000]);
    setInStockOnly(false);
    setSearch('');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || selectedBrand || inStockOnly || priceRange[0] > 0 || priceRange[1] < 100000;

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Categoría</p>
        <div className="space-y-2">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => { setSelectedCategory(selectedCategory === c.name ? '' : c.name); setSearchParams(selectedCategory === c.name ? {} : { category: c.name }); }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-body transition-colors ${selectedCategory === c.name ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Marca</p>
        <div className="space-y-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-body transition-colors ${selectedBrand === b ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Precio máximo</p>
        <input
          type="range"
          min={0}
          max={100000}
          step={1000}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-foreground"
        />
        <p className="font-body text-xs text-muted-foreground mt-1 tabular-nums">Hasta ${priceRange[1].toLocaleString('es-AR')}</p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="rounded accent-foreground" />
        <span className="font-body text-sm text-foreground">Solo en stock</span>
      </label>
      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full text-center font-body text-xs text-muted-foreground underline hover:text-foreground transition-colors">
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Catálogo</h1>

      {/* Search + mobile filter toggle */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-accent bg-background pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button className="flex items-center gap-2 rounded-md border border-accent px-4 py-2.5 text-sm font-body text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-background pt-10">
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <FilterContent />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <p className="font-body text-xs text-muted-foreground mb-4">{filtered.length} productos</p>
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-body text-muted-foreground">No se encontraron productos.</p>
              <button onClick={clearFilters} className="mt-3 font-body text-sm text-foreground underline">Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductDetail product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

export default Catalog;
