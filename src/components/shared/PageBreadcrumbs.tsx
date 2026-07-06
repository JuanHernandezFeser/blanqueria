import { Link } from 'react-router-dom';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Crumb {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: Crumb[];
}

const PageBreadcrumbs = ({ items }: PageBreadcrumbsProps) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      {items.map((item, i) => (
        <BreadcrumbItem key={i}>
          {item.href ? (
            <BreadcrumbLink asChild>
              <Link to={item.href}>{item.label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{item.label}</BreadcrumbPage>
          )}
          {i < items.length - 1 && <BreadcrumbSeparator />}
        </BreadcrumbItem>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

export default PageBreadcrumbs;
