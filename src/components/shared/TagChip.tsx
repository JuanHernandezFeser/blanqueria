import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface TagChipProps {
  tags: string[];
  onRemove: (tag: string) => void;
  onAdd: (tag: string) => void;
  placeholder?: string;
}

const TagChip = ({ tags, onRemove, onAdd, placeholder = 'Agregar...' }: TagChipProps) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-body text-foreground">
              {tag}
              <button onClick={() => onRemove(tag)} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-accent bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <button onClick={handleAdd} className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background font-body hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TagChip;
