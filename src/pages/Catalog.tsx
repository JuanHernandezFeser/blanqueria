import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAmbienteStore } from '@/stores/ambienteStore';
import { type Product, getTotalStock } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import FilterContent from '@/components/CatalogFilters';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import EmptyState from '@/components/shared/EmptyState';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';
import PageLayout from '@/components/shared/PageLayout';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';

type SortOrder = 'featured' | 'price-desc' | 'price-asc';

const Catalog = () => {
  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const ambientes = useAmbienteStore((s) => s.ambientes);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    setSearch(searchFromUrl);
  }, [searchParams]);

  const debouncedSearch = useDebounce(search, 300);

  const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const dynamicBrands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (debouncedSearch && !normalizeText(p.name).includes(normalizeText(debouncedSearch)) && !normalizeText(p.brand).includes(normalizeText(debouncedSearch)) && !normalizeText(p.category).includes(normalizeText(debouncedSearch)) && !normalizeText(p.subcategory || '').includes(normalizeText(debouncedSearch))) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (selectedAmbiente && (!p.ambientes || !p.ambientes.includes(selectedAmbiente))) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (inStockOnly && getTotalStock(p) <= 0) return false;
      return true;
    });
  }, [products, debouncedSearch, selectedCategory, selectedSubcategory, selectedAmbiente, selectedBrand, priceRange, inStockOnly]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortOrder === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'price-asc') list.sort((a, b) => a.price - b.price);
    return list;
  }, [filtered, sortOrder]);

  const clearFilters = () => {
    setSelectedCategory(''); setSelectedSubcategory(''); setSelectedAmbiente(''); setSelectedBrand('');
    setPriceRange([0, 100000]); setInStockOnly(false); setSearch('');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || selectedSubcategory || selectedAmbiente || selectedBrand || inStockOnly || priceRange[0] > 0 || priceRange[1] < 100000;

  const filterProps = {
    categories, ambientes, selectedCategory, selectedSubcategory, selectedAmbiente, selectedBrand,
    priceRange, inStockOnly, brands: dynamicBrands,
    onCategoryChange: setSelectedCategory,
    onSubcategoryChange: setSelectedSubcategory,
    onAmbienteChange: setSelectedAmbiente,
    onBrandChange: setSelectedBrand,
    onPriceRangeChange: setPriceRange,
    onInStockOnlyChange: setInStockOnly,
    onClearFilters: clearFilters,
    hasActiveFilters,
  };

  return (
    <PageLayout>
      <PageBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Catálogo' }]} />
      <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Catálogo</h1>

      <div className="flex gap-3 mb-8">
        <SearchAutocomplete value={search} onChange={setSearch} placeholder="Buscar productos..." />
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button className="flex items-center gap-2 rounded-md border border-accent px-4 py-2.5 text-sm font-body text-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-background pt-10 overflow-y-auto">
            <FilterContent {...filterProps} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-56 flex-shrink-0">
          <FilterContent {...filterProps} />
        </aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-xs text-muted-foreground">{sorted.length} productos</p>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="appearance-none rounded-md border border-accent bg-background pl-3 pr-8 py-2 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price-desc">Mayor precio primero</option>
                <option value="price-asc">Menor precio primero</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {sorted.length === 0 ? (
            <EmptyState message="No se encontraron productos." actionLabel="Limpiar filtros" onAction={clearFilters} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
              {sorted.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} badgeContext="catalogo" />
              ))}
            </div>
          )}
        </div>
      </div>

    </PageLayout>
  );
};

export default Catalog;
