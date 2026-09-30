export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full flex">

      {/* Barra lateral */}
      <div className="hidden lg:flex lg:w-5/12 bg-clinic-secondary text-white flex-col items-center justify-center text-center px-8 gap-6">
        <span className="font-display font-black text-4xl tracking-tight leading-tight">
          <span className="text-clinic-primary">Di</span>rección de{" "}
          <span className="text-clinic-primary">De</span>porte y{" "}
          <span className="text-clinic-primary">Cu</span>ltura{" "}
          <span className="text-clinic-primary">Fí</span>sica
        </span>
        <img
          src="/images/lobo.jpg"
          alt="LOBO"
          className="w-56 md:w-64 lg:w-72 xl:w-80 h-auto object-contain"
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="font-display font-black text-lg text-clinic-primary">
              DIDECUFI
            </span>
          </div>

          <h2 className="font-display font-black text-2xl text-ink">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm text-ink/60 mt-1 mb-6">
              {subtitle}
            </p>
          )}

          {!subtitle && <div className="mb-6" />}

          {children}

        </div>
      </div>

    </div>
  );
}