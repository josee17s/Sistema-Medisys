import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Check, X, Eye, EyeOff } from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import { api } from "../api/client.js";

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

          if (loc.includes("correo")) {
            return "Ingresa un correo electrónico válido.";
          }

          if (loc.includes("code")) {
            return "El código debe contener exactamente 6 números.";
          }

          if (loc.includes("confirm_password")) {
            return "Las contraseñas no coinciden.";
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

  return "Ocurrió un error.";
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [correo, setCorreo] = useState("");
  const [code, setCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---------- Validación en vivo ----------

  const emailOk = EMAIL_REGEX.test(correo);
  const emailError = correo.length > 0 && !emailOk ? "Correo electrónico no válido." : "";

  const codeOk = code.length === 6;
  const codeError = code.length > 0 && !codeOk ? `Faltan ${6 - code.length} dígito(s).` : "";

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(newPassword),
  }));
  const passwordOk = passwordChecks.every((r) => r.passed);

  const confirmOk = confirmPassword.length > 0 && confirmPassword === newPassword;
  const confirmError =
    confirmPassword.length > 0 && !confirmOk ? "Las contraseñas no coinciden." : "";

  const step1Valid = emailOk;
  const step2Valid = codeOk && passwordOk && confirmOk;

  const requestCode = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    if (!step1Valid) return;

    setLoading(true);

    try {
      const res = await api.post(
        "/api/auth/forgot-password",
        { correo }
      );

      setMsg(res.detail);
      setStep(2);
    } catch (err) {
      setError(getValidationMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    setError("");

    if (!step2Valid) return;

    setLoading(true);

    try {
      await api.post(
        "/api/auth/reset-password",
        {
          correo,
          code,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }
      );

      navigate("/login");
    } catch (err) {
      setError(getValidationMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle={
        step === 1
          ? "Te enviaremos un código de verificación a tu correo institucional."
          : "Ingresa el código recibido y tu nueva contraseña."
      }
    >
      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4">

          <div>
            <label className="field-label">
              Correo institucional
            </label>

            <input
              className={`field-input ${emailError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setError("");
              }}
              required
              maxLength={254}
              placeholder="ejemplo@gmail.com"
            />

            {emailError && (
              <p className="text-xs text-red-600 mt-1">{emailError}</p>
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
            disabled={loading || !step1Valid}
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">

          {msg && (
            <div className="text-sm text-clinic-primary bg-clinic-primary/5 border border-clinic-primary/20 rounded-md px-3 py-2">
              {msg}
            </div>
          )}

          <div>
            <label className="field-label">
              Código de verificación
            </label>

            <input
              className={`field-input ${codeError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setCode(value);
                setError("");
              }}
              required
              maxLength={6}
              placeholder="6 números"
            />

            {codeError && (
              <p className="text-xs text-red-600 mt-1">{codeError}</p>
            )}
          </div>

          <div>
            <label className="field-label">
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                className="field-input pr-9"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
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

            {newPassword.length > 0 && (
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

            {newPassword.length === 0 && (
              <p className="text-xs text-ink/50 mt-1">
                Mínimo 8 caracteres, incluyendo mayúscula, minúscula,
                número y carácter especial.
              </p>
            )}
          </div>

          <div>
            <label className="field-label">
              Repetir nueva contraseña
            </label>

            <div className="relative">
              <input
                className={`field-input pr-9 ${confirmError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
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
            disabled={loading || !step2Valid}
          >
            <KeyRound size={16} />

            {loading
              ? "Actualizando..."
              : "Restablecer contraseña"}
          </button>
        </form>
      )}

      <p className="text-sm text-ink/60 mt-6">
        <Link
          to="/login"
          className="text-clinic-primary font-medium hover:underline"
        >
          Volver a inicio de sesión
        </Link>
      </p>
    </AuthLayout>
  );
}