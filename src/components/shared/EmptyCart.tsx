import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyCartProps {
  message?: string;
  actionLabel?: string;
}

const EmptyCart = ({ message = 'Explorá nuestro catálogo y encontrá lo que necesitás.', actionLabel = 'Explorar Catálogo' }: EmptyCartProps) => (
  <div className="container max-w-lg py-20 text-center">
    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h1 className="font-display text-3xl text-foreground mb-2">Tu carrito está vacío</h1>
    <p className="font-body text-sm text-muted-foreground mb-6">{message}</p>
    <Link to="/catalogo" className="inline-block rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
      {actionLabel}
    </Link>
  </div>
);

export default EmptyCart;
