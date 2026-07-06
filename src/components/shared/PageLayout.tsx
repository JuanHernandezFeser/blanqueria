import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

const PageLayout = ({ children, className = '' }: PageLayoutProps) => (
  <div className={`container py-8 md:py-12 ${className}`}>
    {children}
  </div>
);

export default PageLayout;
