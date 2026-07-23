import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bed, Bath, BedDouble, Sofa, Table, Tag } from 'lucide-react';
import type { CategoryItem } from '@/stores/categoryStore';

const iconMap: Record<string, typeof Bed> = {
  Sábanas: Bed,
  Toallas: Bath,
  Almohadas: BedDouble,
  Acolchados: Sofa,
  Manteles: Table,
};

const fallbackIcon = Tag;

interface CategoryCardProps {
  category: CategoryItem;
  index?: number;
}

const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  const Icon = iconMap[category.name] ?? fallbackIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link to={`/catalogo?category=${encodeURIComponent(category.name)}`} className="group flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors duration-300 group-hover:bg-accent/70 group-hover:text-foreground">
          <Icon className="h-7 w-7" />
        </div>
        <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {category.name}
        </span>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
