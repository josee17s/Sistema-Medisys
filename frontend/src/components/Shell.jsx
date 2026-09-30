import { Stethoscope, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Shell({ items, activeKey, onSelect, children }) {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();

    // Recarga completa para limpiar todo el estado del dashboard.
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* =========================
          NAVEGACIÓN
          ========================= */}
      <aside
        className="
          w-full shrink-0
          bg-clinic-secondary text-white
          flex flex-col
          no-print

          md:w-60
          md:min-h-screen
        "
      >

        {/* Logo */}
        <div
          className="
            flex items-center justify-between
            px-4 py-3
            border-b border-white/10

            md:justify-start
            md:gap-2
            md:px-5
            md:h-16
            md:py-0
          "
        >
          <div className="flex items-center gap-2">
            <Stethoscope
              size={20}
              strokeWidth={1.75}
            />

            <span className="font-display font-black text-[17px] tracking-tight">
              Sistema Médico
            </span>
          </div>

          {/* Usuario compacto en móvil */}
          <div className="md:hidden flex items-center gap-2 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-xs text-white truncate max-w-[140px]">
                {user?.nombre} {user?.apellido_paterno}
              </p>

              <p className="text-[10px] text-white/40 truncate max-w-[140px]">
                {user?.role === "admin"
                  ? "Administrador"
                  : user?.specialty?.nombre}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="text-white/60 hover:text-white shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Navegación */}
        <nav
          className="
            flex-1
            px-3 py-2
            flex gap-1
            overflow-x-auto

            md:block
            md:px-3
            md:py-4
            md:space-y-1
          "
        >
          {items.map((item) => {
            const active = item.key === activeKey;

            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`
                  shrink-0
                  flex items-center justify-center
                  gap-2
                  px-3 py-2
                  rounded-md
                  text-sm
                  transition

                  md:w-full
                  md:justify-start
                  md:gap-2.5

                  ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <item.icon
                  size={16}
                  strokeWidth={1.75}
                />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Usuario / cerrar sesión en PC */}
        <div
          className="
            hidden

            md:block
            md:px-5
            md:py-4
            md:border-t
            md:border-white/10
          "
        >
          <p className="text-sm text-white truncate">
            {user?.nombre} {user?.apellido_paterno}
          </p>

          <p className="text-xs text-white/40 truncate mb-3">
            {user?.role === "admin"
              ? "Administrador"
              : user?.specialty?.nombre}
          </p>

          <button
            onClick={onLogout}
            className="
              flex items-center gap-2
              text-xs
              text-white/60
              hover:text-white
            "
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* =========================
          CONTENIDO
          ========================= */}
      <main
        className="
          flex-1
          min-w-0
          overflow-y-auto
          w-full
        "
      >
        {children}
      </main>
    </div>
  );
}