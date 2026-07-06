import { Skeleton } from '@/components/ui/skeleton';

interface ProductSkeletonProps {
  count?: number;
  showCategory?: boolean;
}

const ProductSkeleton = ({ count = 4, showCategory = false }: ProductSkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <Skeleton className="aspect-[4/5] rounded-lg mb-3" />
        {showCategory ? (
          <>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        )}
      </div>
    ))}
  </>
);

export default ProductSkeleton;
