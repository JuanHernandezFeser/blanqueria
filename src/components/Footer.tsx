import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-accent mt-20">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-display text-xl text-foreground mb-3">AIKEN</h4>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
            Hacemos de tu casa tu refugio. Textiles premium para tu hogar.
          </p>
          <div className="flex gap-3">
            {[
              { href: '#', label: 'Instagram', viewBox: '0 0 24 24', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
              { href: '#', label: 'Facebook', viewBox: '0 0 24 24', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg viewBox={s.viewBox} fill="currentColor" className="h-5 w-5">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Navegación</p>
          <ul className="space-y-2">
            {[
              { to: '/', label: 'Inicio' },
              { to: '/catalogo', label: 'Catálogo' },
              { to: '/mi-cuenta', label: 'Mi Cuenta' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="font-body text-sm text-foreground hover:text-muted-foreground transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Contacto</p>
          <ul className="space-y-2 font-body text-sm text-foreground">
            <li>
              <a href="mailto:hola@aike.com.ar" className="hover:text-muted-foreground transition-colors">hola@aike.com.ar</a>
            </li>
            <li>
              <a href="https://wa.me/541145678900" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">+54 11 4567-8900</a>
            </li>
            <li>Buenos Aires, Argentina</li>
          </ul>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Medios de pago</p>
          <div className="flex flex-wrap gap-2">
            {['Visa', 'Mastercard', 'Amex', 'Mercado Pago', 'Naranja', 'Cabal'].map((m) => (
              <span key={m} className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground font-body uppercase tracking-wide">
                {m}
              </span>
            ))}
          </div>
          <p className="font-body text-[10px] text-muted-foreground mt-3 leading-relaxed">
            Envíos a todo el país. Consultá costos en el checkout.
          </p>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-accent flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-body text-xs text-muted-foreground">
          © 2026 AIKEN. Todos los derechos reservados.
        </p>
        <p className="font-body text-[10px] text-muted-foreground/60">
          Diseñado con dedicación en Argentina
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
