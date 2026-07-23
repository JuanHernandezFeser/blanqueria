import { Link } from 'react-router-dom';
import { ShoppingBag, User, Grid3X3, Home } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

interface MobileBottomNavProps {
  onCartOpen: () => void;
}

const MobileBottomNav = ({ onCartOpen }: MobileBottomNavProps) => {
  const totalItems = useCartStore((s) => s.totalItems());
  const user = useAuthStore((s) => s.user);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-accent" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        <Link to="/" className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-body uppercase tracking-wider">Inicio</span>
        </Link>
        <Link to="/catalogo" className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground hover:text-foreground transition-colors">
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[10px] font-body uppercase tracking-wider">Catálogo</span>
        </Link>

        <button onClick={onCartOpen} className="relative flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground hover:text-foreground transition-colors">
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-body uppercase tracking-wider">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -top-0.5 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {totalItems}
            </span>
          )}
        </button>

        <Link to={user ? "/mi-cuenta" : "/login"} className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground hover:text-foreground transition-colors">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-body uppercase tracking-wider">{user ? 'Perfil' : 'Ingresar'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
