import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryItem } from '@/stores/categoryStore';

interface FilterContentProps {
  categories: CategoryItem[];
  selectedCategory: string;
  selectedSubcategory: string;
  selectedBrand: string;
  priceRange: [number, number];
  inStockOnly: boolean;
  brands: string[];
  onCategoryChange: (v: string) => void;
  onSubcategoryChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onPriceRangeChange: (v: [number, number]) => void;
  onInStockOnlyChange: (v: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function FilterContent({
  categories, selectedCategory, selectedSubcategory, selectedBrand,
  priceRange, inStockOnly, brands,
  onCategoryChange, onSubcategoryChange, onBrandChange,
  onPriceRangeChange, onInStockOnlyChange, onClearFilters, hasActiveFilters,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Categoría</p>
        <div className="space-y-1">
          {categories.map((c) => (
            <div key={c.name}>
              <button
                onClick={() => {
                  onCategoryChange(selectedCategory === c.name ? '' : c.name);
                  onSubcategoryChange('');
                }}
                className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-sm font-body transition-colors ${selectedCategory === c.name ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}
              >
                <span>{c.name}</span>
                {c.subcategories && c.subcategories.length > 0 && (
                  <ChevronDown className={`h-4 w-4 transition-transform ${selectedCategory === c.name ? 'rotate-180' : ''}`} />
                )}
              </button>
              {selectedCategory === c.name && c.subcategories && c.subcategories.length > 0 && (
                <div className="ml-3 mt-1 space-y-1">
                  {c.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => onSubcategoryChange(selectedSubcategory === sub ? '' : sub)}
                      className={`flex items-center gap-1 w-full text-left px-3 py-1.5 rounded-md text-xs font-body transition-colors ${
                        selectedSubcategory === sub ? 'bg-foreground/80 text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <ChevronRight className="h-3 w-3" />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Marca</p>
        <div className="space-y-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => onBrandChange(selectedBrand === b ? '' : b)}
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
          onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-foreground"
        />
        <p className="font-body text-xs text-muted-foreground mt-1 tabular-nums">Hasta ${priceRange[1].toLocaleString('es-AR')}</p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => onInStockOnlyChange(e.target.checked)} className="rounded accent-foreground" />
        <span className="font-body text-sm text-foreground">Solo en stock</span>
      </label>
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="w-full text-center font-body text-xs text-muted-foreground underline hover:text-foreground transition-colors">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
