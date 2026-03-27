const Footer = () => (
  <footer className="border-t border-accent mt-20">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="font-display text-xl text-foreground mb-3">AIKE</h4>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            El arte de descansar bien. Textiles premium para tu hogar.
          </p>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Navegación</p>
          <ul className="space-y-2">
            {['Inicio', 'Catálogo', 'Mi Cuenta'].map((l) => (
              <li key={l}>
                <span className="font-body text-sm text-foreground hover:text-muted-foreground transition-colors cursor-pointer">{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">Contacto</p>
          <ul className="space-y-2 font-body text-sm text-foreground">
            <li>hola@aike.com.ar</li>
            <li>+54 11 4567-8900</li>
            <li>Buenos Aires, Argentina</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-accent">
        <p className="font-body text-xs text-muted-foreground text-center">
          © 2026 AIKE. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
