import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { SPECIALTY_LABELS, fmtDateTime } from "./Ui.jsx";

// Define las secciones que pueden aparecer dentro del expediente.
// Cada seccion indica que campos mostrar y si incluye signos vitales.
export const SECTIONS = [
  {
    key: "medicina",
    fields: [
      ["ubicacion", "Ubicación"],
      ["motivo", "Motivo"],
      ["servicio", "Servicio"],
      ["diagnostico", "Diagnóstico"],
      ["plan", "Plan"],
    ],
    vitals: true,
  },
  {
    key: "odontologia",
    fields: [["observaciones", "Observaciones"]],
  },
  {
    key: "psicologia",
    fields: [["motivo_consulta", "Motivo de consulta"]],
  },
  {
    key: "fisioterapia",
    fields: [
      ["diagnostico", "Diagnóstico"],
      ["tratamiento", "Tratamiento"],
    ],
  },
  {
    key: "nutricion",
    fields: [
      ["tipo_dieta", "Tipo de dieta"],
      ["hidratacion", "Hidratación"],
      ["descanso", "Descanso"],
      ["composicion_corporal", "Composición corporal"],
      ["comida", "Comida"],
      ["suplementacion", "Suplementación"],
      ["recomendaciones", "Recomendaciones"],
    ],
  },
];

// Componente encargado de mostrar el expediente clinico
// en un formato preparado para imprimir o guardar como PDF.
export default function PrintableChart({ data, onClose }) {
  // Obtiene la informacion del paciente desde los datos recibidos.
  const { patient } = data;

  // Actualiza el titulo de la pestaña con el nombre del paciente.
  useEffect(() => {
    document.title = `Expediente - ${patient.nombres} ${patient.apellido_paterno}`;

    // Restaura el titulo original cuando el componente se desmonta.
    return () => {
      document.title = "Sistema de Gestión Médica";
    };
  }, [patient]);

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Botones de navegacion e impresion.
          La clase no-print evita que aparezcan al imprimir. */}
      <div className="flex items-center justify-between mb-6 no-print">

        {/* Regresa a la pantalla anterior. */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* Abre la ventana de impresion del navegador. */}
        <button
          onClick={() => window.print()}
          className="btn-primary"
        >
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Contenedor principal del expediente.
          La clase print-area permite aplicar estilos especificos para impresion. */}
      <div className="print-area card p-8">

        {/* Encabezado del expediente. */}
        <div className="flex items-start justify-between border-b border-clinic-border pb-4 mb-4">
          <div>
            <h1 className="font-display font-black text-2xl text-ink">
              Expediente clínico integral
            </h1>

            {/* Muestra la fecha y hora en que se genera el expediente. */}
            <p className="text-sm text-ink/60 mt-1">
              Generado el {fmtDateTime(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Informacion general del paciente. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-8">

          {/* Nombre completo. */}
          <p>
            <span className="text-ink/45">Nombre: </span>
            {patient.nombres} {patient.apellido_paterno} {patient.apellido_materno}
          </p>

          {/* Matricula del paciente. */}
          <p>
            <span className="text-ink/45">Matrícula: </span>
            {patient.matricula}
          </p>

          {/* Edad. Si no existe, muestra un guion. */}
          <p>
            <span className="text-ink/45">Edad: </span>
            {patient.edad ?? "—"}
          </p>

          {/* Peso del paciente. */}
          <p>
            <span className="text-ink/45">Peso: </span>
            {patient.peso ? `${patient.peso} kg` : "—"}
          </p>

          {/* Disciplina deportiva relacionada con el paciente. */}
          <p>
            <span className="text-ink/45">Disciplina: </span>
            {patient.discipline?.nombre || "—"}
          </p>

          {/* Entrenador relacionado con el paciente. */}
          <p>
            <span className="text-ink/45">Entrenador: </span>
            {patient.trainer?.nombre || "—"}
          </p>

          {/* Posicion deportiva. */}
          <p>
            <span className="text-ink/45">Posición: </span>
            {patient.posicion || "—"}
          </p>

          {/* Rama deportiva. */}
          <p>
            <span className="text-ink/45">Rama: </span>
            {patient.rama || "—"}
          </p>
        </div>

        {/* Recorre todas las especialidades definidas en SECTIONS. */}
        {SECTIONS.map((s) => {

          // Obtiene los registros correspondientes a la especialidad actual.
          // Si no existen registros, utiliza un arreglo vacio.
          const records = data[s.key] || [];

          return (
            <div
              key={s.key}
              className="mb-8 break-inside-avoid"
            >

              {/* Nombre de la especialidad. */}
              <h2 className="font-display font-black text-lg text-ink border-b border-clinic-border pb-1.5 mb-3">
                {SPECIALTY_LABELS[s.key]}
              </h2>

              {/* Si la especialidad no tiene registros, muestra un mensaje. */}
              {records.length === 0 ? (
                <p className="text-sm text-ink/40 italic">
                  Sin registros.
                </p>
              ) : (

                // Si existen registros, los muestra uno por uno.
                <div className="space-y-4">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="text-sm break-inside-avoid"
                    >

                      {/* Fecha del registro clinico. */}
                      <p className="text-xs text-ink/45 mb-1">
                        {fmtDateTime(r.fecha)}
                      </p>

                      {/* Muestra los signos vitales cuando la seccion
                          corresponde a medicina y existe al menos uno. */}
                      {s.vitals &&
                        (r.ta ||
                          r.fc ||
                          r.fr ||
                          r.temperatura ||
                          r.spo2) && (
                          <p className="text-xs text-ink/60 mb-1">
                            TA {r.ta || "—"} · FC {r.fc || "—"} · FR{" "}
                            {r.fr || "—"} · T° {r.temperatura || "—"} · SpO2{" "}
                            {r.spo2 || "—"}
                          </p>
                        )}

                      {/* Lista los campos definidos para la especialidad. */}
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {s.fields.map(([key, label]) =>
                          r[key] ? (
                            <div key={key}>

                              {/* Nombre descriptivo del campo. */}
                              <dt className="text-xs text-ink/45">
                                {label}
                              </dt>

                              {/* Valor almacenado en el registro. */}
                              <dd className="text-ink/85">
                                {r[key]}
                              </dd>
                            </div>
                          ) : null
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}