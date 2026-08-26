const parts = [
  'Envíos dentro de Bahía Blanca e Ingeniero White $5.000 (Pedidos superiores a $60.000, envio gratís)',
  'Envíos a Cabildo, Gral. D. Cerri, Punta Alta, Sierra de la Ventana, Villa Ventana y Saldungaray $10.000',
];

const ShippingBanner = () => (
  <>
    <div className="mt-12 mb-0 w-full overflow-hidden bg-amber-600 py-3 text-white px-4">
      <div className="flex items-center justify-center gap-3 whitespace-nowrap font-body text-sm tracking-wide">
        <img src="/logo-correo-argentino.png" alt="Correo Argentino" className="h-5 w-auto" />
        <span>Envíos dentro de Argentina, a cargo de Correo Argentino</span>
      </div>
    </div>
    <div className="mb-0 w-full overflow-hidden bg-amber-600 py-3 text-white px-4">
      <div className="flex animate-marquee-mobile md:animate-marquee whitespace-nowrap font-body text-sm tracking-wide">
        <span className="flex items-center">
          <span>{parts[0]}</span>
          <span className="mx-3 text-white">★</span>
          <span>{parts[1]}</span>
          <span className="mx-4 text-white">★</span>
        </span>
        <span className="flex items-center">
          <span>{parts[0]}</span>
          <span className="mx-3 text-white">★</span>
          <span>{parts[1]}</span>
          <span className="mx-4 text-white">★</span>
        </span>
      </div>
    </div>
  </>
);

export default ShippingBanner;
