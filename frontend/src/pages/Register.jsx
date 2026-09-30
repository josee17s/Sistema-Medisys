import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, CheckCircle2, Check, X, Eye, EyeOff } from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import { api } from "../api/client.js";

const empty = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  correo: "",
  matricula: "",
  password: "",
  confirm_password: "",
  specialty_id: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RULES = [
  { key: "length", label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
  { key: "upper", label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
  { key: "digit", label: "Un número", test: (p) => /\d/.test(p) },
  { key: "special", label: "Un carácter especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getValidationMessage(err) {
  if (!err) return "Ocurrió un error.";

  if (typeof err.message === "string") {
    const message = err.message;

    try {
      const parsed = JSON.parse(message);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];

        if (first?.msg) {
          const loc = first.loc || [];

          if (loc.includes("matricula")) {
            return "El ID debe contener exactamente 9 números.";
          }

          if (loc.includes("correo")) {
            return "Ingresa un correo electrónico válido.";
          }

          if (loc.includes("confirm_password")) {
            return "Las contraseñas no coinciden.";
          }

          if (loc.includes("password")) {
            return first.msg;
          }

          return first.msg;
        }
      }

      if (parsed?.detail) {
        return parsed.detail;
      }
    } catch {
      // El mensaje no era JSON
    }

    return message;
  }

  return "Ocurrió un error al crear la cuenta.";
}

export default function Register() {
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.get("/api/catalogs/specialties").then(setSpecialties).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    let value = e.target.value;

    if (k === "matricula") {
      value = value.replace(/\D/g, "").slice(0, 9);
    }

    setForm((prev) => ({
      ...prev,
      [k]: value,
    }));

    setError("");
  };

  // ---------- Validación en vivo (se recalcula en cada tecla) ----------

  const matriculaOk = form.matricula.length === 9;
  const matriculaError =
    form.matricula.length > 0 && !matriculaOk
      ? `Faltan ${9 - form.matricula.length} dígito(s).`
      : "";

  const emailOk = EMAIL_REGEX.test(form.correo);
  const emailError = form.correo.length > 0 && !emailOk ? "Correo electrónico no válido." : "";

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));
  const passwordOk = passwordChecks.every((r) => r.passed);

  const confirmOk = form.confirm_password.length > 0 && form.confirm_password === form.password;
  const confirmError =
    form.confirm_password.length > 0 && !confirmOk ? "Las contraseñas no coinciden." : "";

  const formValid =
    form.nombre.trim() &&
    form.apellido_paterno.trim() &&
    form.specialty_id &&
    matriculaOk &&
    emailOk &&
    passwordOk &&
    confirmOk;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formValid) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/register", form);
      setDone(true);
    } catch (err) {
      setError(getValidationMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Solicitud enviada">
        <div className="rounded-lg border border-clinic-primary/30 bg-clinic-primary/5 p-5">
          <CheckCircle2 className="text-clinic-primary mb-2" size={24} />

          <p className="text-sm text-ink/80">
            Tu registro quedó como{" "}
            <strong>pendiente de aprobación</strong>. Un administrador
            validará tu cuenta antes de que puedas ingresar.
          </p>
        </div>

        <Link to="/login" className="btn-secondary w-full mt-4">
          Volver a inicio de sesión
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Registro de especialista"
      subtitle="Tu cuenta quedará pendiente de aprobación por el administrador."
    >
      <form onSubmit={onSubmit} className="space-y-3">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Nombre(s)</label>

            <input
              className="field-input"
              value={form.nombre}
              onChange={set("nombre")}
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="field-label">Apellido paterno</label>

            <input
              className="field-input"
              value={form.apellido_paterno}
              onChange={set("apellido_paterno")}
              required
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Apellido materno</label>

          <input
            className="field-input"
            value={form.apellido_materno}
            onChange={set("apellido_materno")}
            maxLength={50}
          />
        </div>

        <div>
          <label className="field-label">Especialidad</label>

          <select
            className="field-input"
            value={form.specialty_id}
            onChange={set("specialty_id")}
            required
          >
            <option value="">Selecciona una especialidad</option>

            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">
              Correo institucional
            </label>

            <input
              className={`field-input ${emailError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
              type="email"
              value={form.correo}
              onChange={set("correo")}
              required
              maxLength={254}
              placeholder="ejemplo@gmail.com"
            />

            {emailError && (
              <p className="text-xs text-red-600 mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label className="field-label">ID</label>

            <input
              className={`field-input ${matriculaError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
              type="text"
              inputMode="numeric"
              value={form.matricula}
              onChange={set("matricula")}
              required
              maxLength={9}
              placeholder="9 números"
            />

            <p className={`text-xs mt-1 ${matriculaError ? "text-red-600" : "text-ink/50"}`}>
              {matriculaError || "Debe contener exactamente 9 números."}
            </p>
          </div>
        </div>

        <div>
          <label className="field-label">Contraseña</label>

          <div className="relative">
            <input
              className="field-input pr-9"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              required
              minLength={8}
              maxLength={128}
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

          {form.password.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {passwordChecks.map((rule) => (
                <li
                  key={rule.key}
                  className={`flex items-center gap-1.5 text-xs ${
                    rule.passed ? "text-emerald-600" : "text-ink/40"
                  }`}
                >
                  {rule.passed ? <Check size={12} /> : <X size={12} />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {form.password.length === 0 && (
            <p className="text-xs text-ink/50 mt-1">
              Mínimo 8 caracteres, incluyendo mayúscula, minúscula,
              número y carácter especial.
            </p>
          )}
        </div>

        <div>
          <label className="field-label">
            Repetir contraseña
          </label>

          <div className="relative">
            <input
              className={`field-input pr-9 ${confirmError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
              type={showConfirm ? "text" : "password"}
              value={form.confirm_password}
              onChange={set("confirm_password")}
              required
              minLength={8}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              tabIndex={-1}
              aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {confirmError && (
            <p className="text-xs text-red-600 mt-1">{confirmError}</p>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || !formValid}
        >
          <UserPlus size={16} />

          {loading ? "Enviando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="text-clinic-primary font-medium hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}