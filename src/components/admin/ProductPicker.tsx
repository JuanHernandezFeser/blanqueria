import { useState } from 'react';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Product } from '@/data/products';
import { formatPrice } from '@/services/shippingService';

interface ProductPickerProps {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

const ProductPicker = ({ products, value, onChange, placeholder = 'Buscar producto...' }: ProductPickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = products.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-full flex items-center gap-2 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          {selected ? (
            <>
              <img src={selected.images?.[0] || selected.image} alt="" decoding="async" className="h-7 w-7 rounded object-cover shrink-0" />
              <span className="truncate flex-1 text-left">{selected.name}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">{formatPrice(selected.price)}</span>
            </>
          ) : (
            <>
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
            </>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command
          filter={(valueToFilter, search) =>
            valueToFilter.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Buscar por nombre, marca o categoría..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {products.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.brand} ${p.category}`}
                onSelect={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <img src={p.images?.[0] || p.image} alt="" decoding="async" className="h-9 w-9 rounded object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.brand} · {p.category}</p>
                </div>
                <span className="text-xs tabular-nums text-foreground shrink-0">{formatPrice(p.price)}</span>
                <Check className={cn('h-4 w-4 shrink-0', value === p.id ? 'opacity-100' : 'opacity-0')} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductPicker;
