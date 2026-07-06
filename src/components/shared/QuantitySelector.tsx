import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: 'sm' | 'md';
}

const btnBase = 'hover:bg-accent transition-colors';
const btnSm = 'p-1 rounded';

const QuantitySelector = ({ quantity, onDecrease, onIncrease, size = 'sm' }: QuantitySelectorProps) => {
  if (size === 'md') {
    return (
      <div className="flex items-center border border-accent rounded-md">
        <button onClick={onDecrease} className="p-2 hover:bg-accent transition-colors rounded-l-md">
          <Minus className="h-3 w-3" />
        </button>
        <span className="font-body text-sm tabular-nums w-8 text-center text-foreground">{quantity}</span>
        <button onClick={onIncrease} className="p-2 hover:bg-accent transition-colors rounded-r-md">
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={onDecrease} className={`${btnBase} ${btnSm}`}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="font-body text-sm tabular-nums w-6 text-center text-foreground">{quantity}</span>
      <button onClick={onIncrease} className={`${btnBase} ${btnSm}`}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
};

export default QuantitySelector;
