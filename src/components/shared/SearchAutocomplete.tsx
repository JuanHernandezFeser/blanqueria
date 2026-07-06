import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import SearchInput from './SearchInput';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const SearchAutocomplete = ({ value, onChange, placeholder, className }: SearchAutocompleteProps) => {
  const products = useProductStore((s) => s.products);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = value.length >= 2
    ? products.filter((p) => {
        const q = normalizeText(value);
        return (
          normalizeText(p.name).includes(q) ||
          normalizeText(p.brand).includes(q) ||
          normalizeText(p.category).includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleSearch = (term: string) => {
    onChange(term);
    setOpen(false);
    if (term.trim()) navigate(`/catalogo?search=${encodeURIComponent(term.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className={`relative flex-1 ${className}`} onKeyDown={handleKeyDown}>
      <SearchInput
        value={value}
        onChange={(v) => { onChange(v); setOpen(true); }}
        placeholder={placeholder}
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-accent rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1 max-h-72 overflow-y-auto">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSearch(p.name)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={p.images?.[0] || p.image} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{p.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.brand}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => handleSearch(value)}
            className="w-full border-t border-accent px-3 py-2.5 font-body text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-center"
          >
            Ver todos los resultados para "{value}"
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
