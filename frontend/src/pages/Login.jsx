import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(identificador, password);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Inicia sesión" subtitle="Accede con tu correo o ID institucional.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="field-label">Correo o ID</label>
          <input
            className="field-input"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="nombre@gmail.com o ID-0001"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="field-label">Contraseña</label>
          <div className="relative">
            <input
              className="field-input pr-9"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="text-right mt-1">
            <Link to="/recuperar" className="text-xs text-clinic-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button className="btn-primary w-full" disabled={loading}>
          <LogIn size={16} />
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="text-sm text-ink/60 mt-6">
        ¿Eres especialista y aún no tienes cuenta?{" "}
        <Link to="/registro" className="text-clinic-primary font-medium hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </AuthLayout>
  );
}