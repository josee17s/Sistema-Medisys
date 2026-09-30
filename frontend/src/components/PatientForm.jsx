import { useEffect, useState } from "react";

import { Modal } from "./Ui.jsx";

import { api } from "../api/client.js";

// Opciones disponibles para clasificar la rama deportiva del paciente
const RAMAS = [
  { value: "", label: "Sin especificar" },
  { value: "varonil", label: "Varonil" },
  { value: "femenil", label: "Femenil" },
  { value: "mixta", label: "Mixta" },
];

// Expresion utilizada para validar el formato del correo electronico
const EMAIL_REGEX = /^[A-Za-z0-9]+(?:[._%+-][A-Za-z0-9]+)*@[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$/;

// Dominios de correo permitidos para los pacientes
const ALLOWED_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "alumno.buap.mx",
  "correo.buap.mx",
];

// Expresion que permite letras y espacios en nombres y apellidos
const NAME_REGEX = /^[\p{L}\s]+$/u;

// Valida los campos del formulario y devuelve los errores encontrados
function getFieldErrors(form) {
  // Objeto donde se almacenan los errores de cada campo
  const errors = {};

  // Obtiene los valores de los campos eliminando espacios innecesarios
  const nombres = form.nombres.trim();
  const apellidoPaterno = form.apellido_paterno.trim();
  const apellidoMaterno = form.apellido_materno.trim();
  const matricula = form.matricula.trim();
  const correo = form.correo.trim().toLowerCase();
  const posicion = form.posicion.trim();

  // Valida el nombre del paciente
  if (nombres) {
    if (nombres.length < 2)
      errors.nombres = "Debe tener al menos 2 caracteres.";
    else if (nombres.length > 50)
      errors.nombres = "No puede superar 50 caracteres.";
    else if (!NAME_REGEX.test(nombres))
      errors.nombres = "Solo letras y espacios.";
  }

  // Valida el apellido paterno
  if (apellidoPaterno) {
    if (apellidoPaterno.length < 2)
      errors.apellido_paterno = "Debe tener al menos 2 caracteres.";
    else if (apellidoPaterno.length > 50)
      errors.apellido_paterno = "No puede superar 50 caracteres.";
    else if (!NAME_REGEX.test(apellidoPaterno))
      errors.apellido_paterno = "Solo letras y espacios.";
  }

  // Valida el apellido materno
  if (apellidoMaterno) {
    if (apellidoMaterno.length < 2)
      errors.apellido_materno = "Debe tener al menos 2 caracteres.";
    else if (apellidoMaterno.length > 50)
      errors.apellido_materno = "No puede superar 50 caracteres.";
    else if (!NAME_REGEX.test(apellidoMaterno))
      errors.apellido_materno = "Solo letras y espacios.";
  }

  // Verifica que la matricula tenga al menos 9 digitos
  if (matricula && matricula.length < 9) {
    errors.matricula = `Faltan ${9 - matricula.length} dígito(s).`;
  }

  // Valida el formato y dominio del correo
  if (correo) {
    if (correo.length > 254) {
      errors.correo = "El correo es demasiado largo.";
    } else if (!EMAIL_REGEX.test(correo)) {
      errors.correo = "Ingresa un correo electrónico válido.";
    } else if (!ALLOWED_DOMAINS.includes(correo.split("@")[1])) {
      errors.correo = "Dominio de correo no permitido.";
    }
  }

  // Valida que la edad sea un numero entero dentro del rango permitido
  if (form.edad !== "") {
    const edad = Number(form.edad);

    if (!Number.isInteger(edad))
      errors.edad = "Debe ser un número entero.";
    else if (edad < 1 || edad > 120)
      errors.edad = "Debe estar entre 1 y 120 años.";
  }

  // Valida que el peso sea un numero valido dentro del rango permitido
  if (form.peso !== "") {
    const peso = Number(form.peso);

    if (!Number.isFinite(peso))
      errors.peso = "Debe ser un número válido.";
    else if (peso < 0.1 || peso > 500)
      errors.peso = "Debe estar entre 0.1 y 500 kg.";
  }

  // Verifica que la posicion no supere los 50 caracteres
  if (posicion.length > 50) {
    errors.posicion = "No puede superar 50 caracteres.";
  }

  // Devuelve los errores encontrados
  return errors;
}

// Formulario utilizado para crear o editar pacientes
export default function PatientForm({ mode, patient, onClose, onSaved }) {
  // Lista de disciplinas disponibles
  const [disciplines, setDisciplines] = useState([]);

  // Lista de entrenadores disponibles
  const [trainers, setTrainers] = useState([]);

  // Mensaje de error mostrado en el formulario
  const [error, setError] = useState("");

  // Indica si se esta guardando la informacion
  const [saving, setSaving] = useState(false);

  // Estado principal que contiene los datos del paciente
  const [form, setForm] = useState({
    nombres: patient?.nombres || "",
    apellido_paterno: patient?.apellido_paterno || "",
    apellido_materno: patient?.apellido_materno || "",
    matricula: patient?.matricula || "",
    correo: patient?.correo || "",
    edad: patient?.edad ?? "",
    peso: patient?.peso ?? "",
    discipline_id: patient?.discipline?.id || "",
    trainer_id: patient?.trainer?.id || "",
    posicion: patient?.posicion || "",
    rama: patient?.rama || "",
  });

  // Carga las disciplinas y entrenadores cuando se abre el formulario
  useEffect(() => {
    api.get("/api/catalogs/disciplines").then(setDisciplines);
    api.get("/api/catalogs/trainers").then(setTrainers);
  }, []);

  // Funcion generica para actualizar cualquier campo del formulario
  const set = (k) => (e) => {
    // Actualiza solamente el campo que cambio
    setForm((prev) => ({
      ...prev,
      [k]: e.target.value,
    }));

    // Limpia el mensaje de error al modificar un campo
    setError("");
  };

  // ---------- Validacion en vivo ----------

  // Obtiene los errores actuales de los campos
  const fieldErrors = getFieldErrors(form);

  // Verifica que los campos obligatorios tengan informacion
  const requiredFilled =
    form.nombres.trim() &&
    form.apellido_paterno.trim() &&
    form.matricula.trim().length === 9 &&
    form.correo.trim();

  // Determina si el formulario cumple todas las validaciones
  const formValid =
    requiredFilled &&
    Object.keys(fieldErrors).length === 0;

  // Devuelve las clases CSS para marcar visualmente un campo con error
  const errClass = (key) =>
    fieldErrors[key]
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "";

  // Procesa el envio del formulario
  const submit = async (e) => {
    // Evita que el navegador recargue la pagina
    e.preventDefault();

    // Limpia el mensaje de error anterior
    setError("");

    // Impide guardar si el formulario no es valido
    if (!formValid) {
      setError("Revisa los campos marcados antes de guardar.");
      return;
    }

    // Activa el indicador de guardado
    setSaving(true);

    try {
      // Prepara los datos que se enviaran al backend
      const payload = {
        nombres: form.nombres.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim() || null,
        matricula: form.matricula.trim(),
        correo: form.correo.trim().toLowerCase(),

        // Convierte la edad a numero o envia null si esta vacia
        edad: form.edad === "" ? null : Number(form.edad),

        // Convierte el peso a numero o envia null si esta vacio
        peso: form.peso === "" ? null : Number(form.peso),

        // Envia null cuando no se selecciono una disciplina
        discipline_id: form.discipline_id || null,

        // Envia null cuando no se selecciono un entrenador
        trainer_id: form.trainer_id || null,

        // Envia null cuando no se especifico una rama
        rama: form.rama || null,

        // Envia null cuando no se especifico una posicion
        posicion: form.posicion.trim() || null,
      };

      // Determina si se creara un paciente nuevo o se actualizara uno existente
      if (mode === "create") {
        // Envia los datos para crear un nuevo paciente
        await api.post("/api/patients", payload);
      } else {
        // Envia los datos para actualizar el paciente existente
        await api.put(`/api/patients/${patient.id}`, payload);
      }

      // Notifica al componente padre que la operacion termino correctamente
      onSaved();
    } catch (err) {
      // Muestra el mensaje de error recibido desde la API
      setError(err.message);
    } finally {
      // Finaliza el estado de guardado
      setSaving(false);
    }
  };

  return (
    <Modal
      // Cambia el titulo dependiendo de si se crea o edita un paciente
      title={
        mode === "create"
          ? "Nuevo paciente"
          : "Editar paciente"
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4">

        {/* Datos personales del paciente */}
        <div className="grid grid-cols-2 gap-3">

          {/* Campo para los nombres */}
          <div className="col-span-2">
            <label className="field-label">
              Nombre(s)
            </label>

            <input
              className={`field-input ${errClass("nombres")}`}
              value={form.nombres}
              onChange={set("nombres")}
              maxLength={50}
              required
            />

            {fieldErrors.nombres && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.nombres}
              </p>
            )}
          </div>

          {/* Campo para el apellido paterno */}
          <div>
            <label className="field-label">
              Apellido paterno
            </label>

            <input
              className={`field-input ${errClass("apellido_paterno")}`}
              value={form.apellido_paterno}
              onChange={set("apellido_paterno")}
              maxLength={50}
              required
            />

            {fieldErrors.apellido_paterno && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.apellido_paterno}
              </p>
            )}
          </div>

          {/* Campo para el apellido materno */}
          <div>
            <label className="field-label">
              Apellido materno
            </label>

            <input
              className={`field-input ${errClass("apellido_materno")}`}
              value={form.apellido_materno}
              onChange={set("apellido_materno")}
              maxLength={50}
            />

            {fieldErrors.apellido_materno && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.apellido_materno}
              </p>
            )}
          </div>

          {/* Campo para la matricula */}
          <div>
            <label className="field-label">
              Matrícula
            </label>

            <input
              className={`field-input ${errClass("matricula")}`}
              value={form.matricula}
              onChange={(e) => {
                // Actualiza la matricula permitiendo solamente numeros
                setForm((prev) => ({
                  ...prev,
                  matricula: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 9),
                }));

                // Limpia el mensaje de error
                setError("");
              }}
              maxLength={9}
              inputMode="numeric"
              required
            />

            {fieldErrors.matricula && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.matricula}
              </p>
            )}
          </div>

          {/* Campo para el correo */}
          <div>
            <label className="field-label">
              Correo institucional
            </label>

            <input
              className={`field-input ${errClass("correo")}`}
              type="email"
              value={form.correo}
              onChange={(e) => {
                // Actualiza el correo ingresado
                setForm((prev) => ({
                  ...prev,
                  correo: e.target.value,
                }));

                // Limpia el mensaje de error
                setError("");
              }}
              maxLength={254}
              required
            />

            {fieldErrors.correo && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.correo}
              </p>
            )}
          </div>

          {/* Campo para la edad */}
          <div>
            <label className="field-label">
              Edad
            </label>

            <input
              className={`field-input ${errClass("edad")}`}
              type="number"
              min="1"
              max="120"
              step="1"
              value={form.edad}
              onChange={set("edad")}
            />

            {fieldErrors.edad && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.edad}
              </p>
            )}
          </div>

          {/* Campo para el peso */}
          <div>
            <label className="field-label">
              Peso (kg)
            </label>

            <input
              className={`field-input ${errClass("peso")}`}
              type="number"
              min="0.1"
              max="500"
              step="0.1"
              value={form.peso}
              onChange={set("peso")}
            />

            {fieldErrors.peso && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.peso}
              </p>
            )}
          </div>
        </div>

        {/* Seccion de informacion deportiva */}
        <div className="border-t border-clinic-border pt-4">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
            Datos deportivos
          </p>

          <div className="grid grid-cols-2 gap-3">

            {/* Selector de disciplina */}
            <div>
              <label className="field-label">
                Disciplina
              </label>

              <select
                className="field-input"
                value={form.discipline_id}
                onChange={set("discipline_id")}
              >
                <option value="">
                  Sin disciplina
                </option>

                {/* Genera las opciones con las disciplinas obtenidas de la API */}
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de entrenador */}
            <div>
              <label className="field-label">
                Entrenador
              </label>

              <select
                className="field-input"
                value={form.trainer_id}
                onChange={set("trainer_id")}
              >
                <option value="">
                  Sin entrenador
                </option>

                {/* Genera las opciones con los entrenadores obtenidos de la API */}
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo para la posicion deportiva */}
            <div>
              <label className="field-label">
                Posición (opcional)
              </label>

              <input
                className={`field-input ${errClass("posicion")}`}
                value={form.posicion}
                onChange={set("posicion")}
                maxLength={50}
              />

              {fieldErrors.posicion && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.posicion}
                </p>
              )}
            </div>

            {/* Selector de rama deportiva */}
            <div>
              <label className="field-label">
                Rama
              </label>

              <select
                className="field-input"
                value={form.rama}
                onChange={set("rama")}
              >
                {/* Genera las opciones definidas en RAMAS */}
                {RAMAS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mensaje de error general del formulario */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Botones para cancelar o guardar */}
        <div className="flex justify-end gap-2 pt-2">

          {/* Cierra el formulario sin guardar */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          {/* Guarda el paciente y se desactiva mientras se procesa la solicitud */}
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !formValid}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}