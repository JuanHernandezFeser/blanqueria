import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, Search } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CartDrawer from '@/components/CartDrawer';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';

const Navbar = () => {
  const totalItems = useCartStore((s) => s.totalItems());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

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
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="AIKEN" className="h-8 md:h-10 w-auto" />
          <span className="font-display text-2xl text-foreground tracking-tight">AIKEN</span>
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

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-xs mx-4">
          <SearchAutocomplete value={search} onChange={setSearch} placeholder="Buscar productos..." />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5 text-foreground" />
          </button>

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
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => useAuthStore.getState().login('admin@tienda.com', 'admin123')} className="font-body text-xs text-muted-foreground/50 hover:text-foreground transition-colors border border-border/30 rounded px-1.5 py-0.5">
                Admin
              </button>
              <button onClick={() => useAuthStore.getState().login('user@tienda.com', 'user123')} className="font-body text-xs text-muted-foreground/50 hover:text-foreground transition-colors border border-border/30 rounded px-1.5 py-0.5">
                Cliente
              </button>
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-4 w-4" />
                <span className="font-body">Ingresar</span>
              </Link>
            </div>
          )}
          <Link to="/login" className="md:hidden p-2">
            <User className="h-5 w-5 text-foreground" />
          </Link>
          <button onClick={() => setCartOpen(true)} className="relative p-2 -mr-2" data-testid="cart-button">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search panel */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-accent px-4 py-3 bg-background">
          <SearchAutocomplete value={search} onChange={setSearch} placeholder="Buscar productos..." />
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
};

export default Navbar;
