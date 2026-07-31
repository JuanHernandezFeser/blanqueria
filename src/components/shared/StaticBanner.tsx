const StaticBanner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-12 mb-0 w-full bg-amber-600 py-3 text-white px-4">
    <div className="flex items-center justify-center gap-3">
      <img
        src="/logo-correo-argentino.png"
        alt="Correo Argentino"
        className="h-6 w-auto"
      />
      <p className="text-center font-body text-sm tracking-wide">{children}</p>
    </div>
  </div>
);

export default StaticBanner;
