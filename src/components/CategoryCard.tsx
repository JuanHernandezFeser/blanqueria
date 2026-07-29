import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CategoryItem } from '@/stores/categoryStore';

interface CategoryCardProps {
  category: CategoryItem;
  index?: number;
}

const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link to={`/catalogo?category=${encodeURIComponent(category.name)}`} className="group flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent overflow-hidden transition-colors duration-300 group-hover:bg-accent/70">
          {category.image ? (
            <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">
              {category.name.slice(0, 2)}
            </span>
          )}
        </div>
        <span className="font-body text-[11px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {category.name}
        </span>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
