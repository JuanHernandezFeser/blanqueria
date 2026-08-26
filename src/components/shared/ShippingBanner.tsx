const ShippingBanner = () => (
  <div className="mt-12 mb-0 w-full overflow-hidden bg-amber-600 py-3 text-white px-4">
    <div className="flex items-center justify-center gap-3 whitespace-nowrap font-body text-sm tracking-wide">
      <img src="/logo-correo-argentino.png" alt="Correo Argentino" className="h-5 w-auto" />
      <span>Envíos dentro de Argentina, a cargo de Correo Argentino</span>
    </div>
  </div>
);

export default ShippingBanner;
