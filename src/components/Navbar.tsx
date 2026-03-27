import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navbar = () => {
  const totalItems = useCartStore((s) => s.totalItems());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/catalogo', label: 'Catálogo' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md" style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)' }}>
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button className="p-2 -ml-2">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-background">
            <nav className="flex flex-col gap-6 mt-8">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="font-body text-lg text-foreground hover:text-muted-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-body text-lg text-foreground hover:text-muted-foreground transition-colors">
                  Admin
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="font-display text-2xl text-foreground tracking-tight">
          AIKE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="font-body text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-200">
              {l.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link to="/admin" className="font-body text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-200">
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/mi-cuenta" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                {user.name}
              </Link>
              <button onClick={logout} className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-4 w-4" />
              <span className="font-body">Ingresar</span>
            </Link>
          )}
          <Link to="/login" className="md:hidden p-2">
            <User className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/carrito" className="relative p-2 -mr-2">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
