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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/catalogo?category=${encodeURIComponent(category.name)}`} className="group block">
        <div className="aspect-[4/5] rounded-lg overflow-hidden bg-muted mb-3">
          <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] image-outline" loading="lazy" />
        </div>
        <h3 className="font-body text-sm font-medium text-foreground">{category.name}</h3>
        <p className="font-body text-xs text-muted-foreground">{category.description}</p>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
