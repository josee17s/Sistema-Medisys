import { useEffect, useState } from "react";

import { Save, Lock, UserCircle, Check, X, Eye, EyeOff } from "lucide-react";

import { api } from "../api/client";

// Expresion utilizada para validar nombres y apellidos
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

// Expresion utilizada para validar el formato del correo electronico
//const EMAIL_REGEX = /^[^\s@]+@[^\s@]+**\\.**[^\s@]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Dominios de correo permitidos en el sistema
const ALLOWED_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "alumno.buap.com",
  "correo.buap.mx",
];

// Reglas que debe cumplir una nueva contrasena
const PASSWORD_RULES = [
  {
    key: "length",
    label: "Al menos 8 caracteres",
    test: (p) => p.length >= 8,
  },
  {
    key: "upper",
    label: "Una letra mayúscula",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: "lower",
    label: "Una letra minúscula",
    test: (p) => /[a-z]/.test(p),
  },
  {
    key: "digit",
    label: "Un número",
    test: (p) => /\d/.test(p),
  },
  {
    key: "special",
    label: "Un carácter especial",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

// Valida los campos del formulario y devuelve los errores encontrados
function getFieldErrors(form) {
  // Objeto donde se almacenaran los errores de cada campo
  const errors = {};

  // Obtiene y limpia los valores de los campos
  const nombre = form.nombre.trim();
  const apellidoPaterno = form.apellido_paterno.trim();
  const apellidoMaterno = form.apellido_materno.trim();
  const matricula = form.matricula.trim();
  const correo = form.correo.trim().toLowerCase();

  // Valida el nombre
  if (nombre) {
    if (nombre.length < 2)
      errors.nombre = "Debe tener al menos 2 caracteres.";
    else if (!NAME_REGEX.test(nombre))
      errors.nombre = "Solo letras y espacios.";
  }

  // Valida el apellido paterno
  if (apellidoPaterno) {
    if (apellidoPaterno.length < 2)
      errors.apellido_paterno = "Debe tener al menos 2 caracteres.";
    else if (!NAME_REGEX.test(apellidoPaterno))
      errors.apellido_paterno = "Solo letras y espacios.";
  }

  // Valida el apellido materno
  if (apellidoMaterno) {
    if (apellidoMaterno.length < 2)
      errors.apellido_materno = "Debe tener al menos 2 caracteres.";
    else if (!NAME_REGEX.test(apellidoMaterno))
      errors.apellido_materno = "Solo letras y espacios.";
  }

  // Verifica si la matricula tiene menos de 9 digitos
  if (matricula && matricula.length < 9) {
    errors.matricula = `Faltan ${9 - matricula.length} dígito(s).`;
  }

  // Valida el formato y dominio del correo
  if (correo) {
    if (!EMAIL_REGEX.test(correo)) {
      errors.correo = "Ingresa un correo electrónico válido.";
    } else if (!ALLOWED_DOMAINS.includes(correo.split("@")[1])) {
      errors.correo = "Dominio de correo no permitido.";
    }
  }

  // Verifica que las contrasenas coincidan
  if (
    form.confirm_password &&
    form.confirm_password !== form.password
  ) {
    errors.confirm_password = "Las contraseñas no coinciden.";
  }

  // Devuelve todos los errores encontrados
  return errors;
}

// Componente encargado de mostrar y actualizar el perfil del usuario
export default function MiPerfil() {
  // Estado que contiene los datos del formulario
  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    matricula: "",
    correo: "",
    password: "",
    confirm_password: "",
  });

  // Indica si se estan cargando los datos del perfil
  const [loading, setLoading] = useState(true);

  // Indica si se esta guardando una modificacion
  const [saving, setSaving] = useState(false);

  // Almacena mensajes de error
  const [error, setError] = useState("");

  // Almacena mensajes de confirmacion
  const [success, setSuccess] = useState("");

  // Controla si se muestra la nueva contrasena
  const [showPassword, setShowPassword] = useState(false);

  // Controla si se muestra la confirmacion de la contrasena
  const [showConfirm, setShowConfirm] = useState(false);

  // Carga el perfil cuando el componente se monta
  useEffect(() => {
    cargarPerfil();
  }, []);

  // Obtiene los datos actuales del usuario desde la API
  async function cargarPerfil() {
    try {
      // Activa el indicador de carga y limpia errores anteriores
      setLoading(true);
      setError("");

      // Solicita al backend los datos del usuario autenticado
      const user = await api.get("/api/auth/me");

      // Coloca los datos obtenidos en el formulario
      setForm({
        nombre: user.nombre || "",
        apellido_paterno: user.apellido_paterno || "",
        apellido_materno: user.apellido_materno || "",
        matricula: user.matricula || "",
        correo: user.correo || "",
        password: "",
        confirm_password: "",
      });
    } catch (err) {
      // Muestra el error cuando no se pudo cargar el perfil
      setError(err.message || "No se pudo cargar tu perfil.");
    } finally {
      // Finaliza el estado de carga
      setLoading(false);
    }
  }

  // Actualiza el estado del formulario cuando cambia un campo
  function handleChange(e) {
    const { name, value: inputValue } = e.target;

    // Guarda inicialmente el valor ingresado
    let value = inputValue;

    // La matricula solo permite numeros y un maximo de 9 digitos
    if (name === "matricula") {
      value = value.replace(/\D/g, "").slice(0, 9);
    }

    // Actualiza solamente el campo que cambio
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpia los mensajes anteriores al modificar el formulario
    setError("");
    setSuccess("");
  }

  // Obtiene los errores actuales de los campos
  const fieldErrors = getFieldErrors(form);

  // Determina si el usuario desea cambiar su contrasena
  const wantsPasswordChange =
    form.password.length > 0 ||
    form.confirm_password.length > 0;

  // Evalua cada regla de seguridad de la nueva contrasena
  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));

  // Verifica que la contrasena cumpla todas las reglas
  const passwordOk =
    !wantsPasswordChange ||
    passwordChecks.every((r) => r.passed);

  // Verifica que la confirmacion coincida con la nueva contrasena
  const confirmOk =
    !wantsPasswordChange ||
    (form.confirm_password.length > 0 &&
      form.confirm_password === form.password);

  // Verifica que los campos obligatorios tengan informacion
  const requiredFilled =
    form.nombre.trim() &&
    form.apellido_paterno.trim() &&
    form.matricula.trim().length === 9 &&
    form.correo.trim();

  // Determina si todo el formulario cumple las validaciones
  const formValid =
    requiredFilled &&
    Object.keys(fieldErrors).length === 0 &&
    passwordOk &&
    confirmOk;

  // Devuelve las clases CSS para marcar campos con errores
  const errClass = (key) =>
    fieldErrors[key]
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "";

  // Procesa el envio del formulario
  async function handleSubmit(e) {
    // Evita que el navegador recargue la pagina
    e.preventDefault();

    // Limpia los mensajes anteriores
    setError("");
    setSuccess("");

    // Impide guardar si el formulario no es valido
    if (!formValid) {
      setError("Revisa los campos marcados antes de guardar.");
      return;
    }

    try {
      // Activa el indicador de guardado
      setSaving(true);

      // Construye los datos que se enviaran al backend
      const payload = {
        nombre: form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim() || null,
        matricula: form.matricula.trim(),
        correo: form.correo.trim().toLowerCase(),
      };

      // Agrega la nueva contrasena solamente si el usuario desea cambiarla
      if (form.password) {
        payload.password = form.password;
        payload.confirm_password = form.confirm_password;
      }

      // Envia los cambios del perfil al backend
      const updatedUser = await api.put(
        "/api/auth/profile",
        payload
      );

      // Actualiza el formulario con los datos devueltos por el servidor
      setForm({
        nombre: updatedUser.nombre || "",
        apellido_paterno: updatedUser.apellido_paterno || "",
        apellido_materno: updatedUser.apellido_materno || "",
        matricula: updatedUser.matricula || "",
        correo: updatedUser.correo || "",
        password: "",
        confirm_password: "",
      });

      // Muestra el mensaje de actualizacion exitosa
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      // Muestra el error cuando no se pudo actualizar el perfil
      setError(
        err.message || "No se pudo actualizar el perfil."
      );
    } finally {
      // Finaliza el estado de guardado
      setSaving(false);
    }
  }

  // Muestra una pantalla de carga mientras se obtiene el perfil
  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-clinic-border bg-white p-8">
          <div className="py-10 text-center text-ink/60">
            Cargando perfil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl">

        {/* Encabezado del perfil */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-ink/5 p-3">
            <UserCircle
              size={28}
              className="text-ink/70"
            />
          </div>

          <div>
            <h1 className="font-display font-black text-2xl text-ink">
              Mi perfil
            </h1>

            <p className="text-sm text-ink/60 mt-1">
              Actualiza tus datos personales y contraseña.
            </p>
          </div>
        </div>

        {/* Tarjeta principal que contiene el formulario */}
        <div className="rounded-lg border border-clinic-border bg-white">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >

            {/* Seccion de datos personales */}
            <div>
              <h2 className="mb-4 font-display font-black text-lg text-ink">
                Datos personales
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Campo de nombre */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Nombre
                  </label>

                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Nombre"
                    maxLength={50}
                    className={`field-input ${errClass("nombre")}`}
                  />

                  {fieldErrors.nombre && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.nombre}
                    </p>
                  )}
                </div>

                {/* Campo de apellido paterno */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Apellido paterno
                  </label>

                  <input
                    name="apellido_paterno"
                    value={form.apellido_paterno}
                    onChange={handleChange}
                    placeholder="Apellido paterno"
                    maxLength={50}
                    className={`field-input ${errClass("apellido_paterno")}`}
                  />

                  {fieldErrors.apellido_paterno && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.apellido_paterno}
                    </p>
                  )}
                </div>

                {/* Campo de apellido materno */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Apellido materno
                  </label>

                  <input
                    name="apellido_materno"
                    value={form.apellido_materno}
                    onChange={handleChange}
                    placeholder="Apellido materno"
                    maxLength={50}
                    className={`field-input ${errClass("apellido_materno")}`}
                  />

                  {fieldErrors.apellido_materno && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.apellido_materno}
                    </p>
                  )}
                </div>

                {/* Campo de matricula */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Matrícula
                  </label>

                  <input
                    name="matricula"
                    value={form.matricula}
                    onChange={handleChange}
                    placeholder="Matrícula"
                    inputMode="numeric"
                    maxLength={10}
                    className={`field-input ${errClass("matricula")}`}
                  />

                  {fieldErrors.matricula && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.matricula}
                    </p>
                  )}
                </div>

                {/* Campo de correo electronico */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Correo electrónico
                  </label>

                  <input
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    maxLength={254}
                    className={`field-input ${errClass("correo")}`}
                  />

                  {fieldErrors.correo && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.correo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seccion para cambiar la contraseña */}
            <div className="border-t border-clinic-border pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Lock
                  size={20}
                  className="text-ink/60"
                />

                <div>
                  <h2 className="font-display font-black text-lg text-ink">
                    Cambiar contraseña
                  </h2>

                  <p className="text-sm text-ink/60 mt-1">
                    Déjalos vacíos si no deseas cambiar tu contraseña.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Campo para introducir la nueva contraseña */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Nueva contraseña
                  </label>

                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Nueva contraseña"
                      maxLength={128}
                      className="field-input pr-9"
                    />

                    {/* Boton para mostrar u ocultar la contraseña */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                      tabIndex={-1}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Muestra las reglas de seguridad cuando se escribe una contraseña */}
                  {form.password.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {passwordChecks.map((rule) => (
                        <li
                          key={rule.key}
                          className={`flex items-center gap-1.5 text-xs ${
                            rule.passed
                              ? "text-emerald-600"
                              : "text-ink/40"
                          }`}
                        >
                          {/* Muestra si la regla fue cumplida o no */}
                          {rule.passed ? (
                            <Check size={12} />
                          ) : (
                            <X size={12} />
                          )}

                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Campo para confirmar la nueva contraseña */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Confirmar nueva contraseña
                  </label>

                  <div className="relative">
                    <input
                      name="confirm_password"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Repite la nueva contraseña"
                      maxLength={128}
                      className={`field-input pr-9 ${errClass(
                        "confirm_password"
                      )}`}
                    />

                    {/* Boton para mostrar u ocultar la confirmacion */}
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                      tabIndex={-1}
                      aria-label={
                        showConfirm
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showConfirm ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Muestra el error cuando las contraseñas no coinciden */}
                  {fieldErrors.confirm_password && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.confirm_password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seccion informativa de la especialidad */}
            <div className="border-t border-clinic-border pt-6">
              <h2 className="mb-2 font-display font-black text-lg text-ink">
                Especialidad
              </h2>

              <p className="text-sm text-ink/60">
                La especialidad no puede ser modificada desde el perfil.
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Mensaje de operacion exitosa */}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {/* Botones para cancelar o guardar los cambios */}
            <div className="flex justify-end gap-2 border-t border-clinic-border pt-5">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  cargarPerfil();
                  setError("");
                  setSuccess("");
                }}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || !formValid}
                className="btn-primary"
              >
                <Save size={18} />

                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}