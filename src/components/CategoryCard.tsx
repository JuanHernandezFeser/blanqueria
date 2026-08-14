import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CategoryItem } from '@/stores/categoryStore';

interface CategoryCardProps {
  category: CategoryItem;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="py-2 w-28 shrink-0"
    >
      <Link to={`/catalogo?category=${encodeURIComponent(category.name)}`} className="group flex flex-col items-center gap-3 w-full">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-accent overflow-hidden transition-all duration-300 group-hover:bg-accent/70 group-hover:scale-110 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-foreground group-hover:ring-offset-2 ring-offset-background">
          {category.image ? (
            <img src={category.image} alt={category.name} decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">
              {category.name.slice(0, 2)}
            </span>
          )}
        </div>
        <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300 text-center">
          {category.name}
        </span>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
