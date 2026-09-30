import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { SPECIALTY_LABELS, fmtDateTime } from "./Ui.jsx";
import { SECTIONS } from "./PrintableChart.jsx";

export default function PrintableRecord({
  patient,
  type,
  record,
  onClose,
}) {
  const section = SECTIONS.find((s) => s.key === type);

  useEffect(() => {
    document.title = `Nota - ${patient.nombres} ${patient.apellido_paterno}`;

    return () => {
      document.title = "Sistema de Gestión Médica";
    };
  }, [patient]);

  if (!section || !record) {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <button
          onClick={() => window.print()}
          className="btn-primary"
        >
          <Printer size={16} />
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="print-area card p-8">

        {/* Encabezado */}
        <div className="border-b border-clinic-border pb-4 mb-6">
          <h1 className="font-display font-black text-2xl text-ink">
            Nota clínica
          </h1>

          <p className="text-sm text-ink/60 mt-1">
            {SPECIALTY_LABELS[type]}
          </p>

          <div className="text-xs text-ink/45 mt-1">
            <p>
              Registrada el {fmtDateTime(record.fecha)}
            </p>

            <p>
              Especialista:{" "}
              {record.specialist
                ? `${record.specialist.nombre} ${record.specialist.apellido_paterno}${
                    record.specialist.apellido_materno
                      ? ` ${record.specialist.apellido_materno}`
                      : ""
                  }`
                : "No disponible"}
            </p>
          </div>
        </div>

        {/* Datos del paciente */}
        <div className="mb-8">
          <h2 className="font-display font-black text-lg text-ink border-b border-clinic-border pb-1.5 mb-3">
            Datos del paciente
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <p>
              <span className="text-ink/45">Nombre: </span>
              {patient.nombres} {patient.apellido_paterno}{" "}
              {patient.apellido_materno}
            </p>

            <p>
              <span className="text-ink/45">Matrícula: </span>
              {patient.matricula || "—"}
            </p>

            <p>
              <span className="text-ink/45">Edad: </span>
              {patient.edad ?? "—"}
            </p>

            <p>
              <span className="text-ink/45">Peso: </span>
              {patient.peso ? `${patient.peso} kg` : "—"}
            </p>

            <p>
              <span className="text-ink/45">Disciplina: </span>
              {patient.discipline?.nombre || "—"}
            </p>

            <p>
              <span className="text-ink/45">Entrenador: </span>
              {patient.trainer?.nombre || "—"}
            </p>

            <p>
              <span className="text-ink/45">Posición: </span>
              {patient.posicion || "—"}
            </p>

            <p>
              <span className="text-ink/45">Rama: </span>
              {patient.rama || "—"}
            </p>
          </div>
        </div>

        {/* Nota */}
        <div>
          <h2 className="font-display font-black text-lg text-ink border-b border-clinic-border pb-1.5 mb-3">
            {SPECIALTY_LABELS[type]}
          </h2>

          {section.vitals &&
            (record.ta ||
              record.fc ||
              record.fr ||
              record.temperatura ||
              record.spo2) && (
              <div className="mb-4">
                <p className="text-xs text-ink/45 mb-1">
                  Signos vitales
                </p>

                <p className="text-sm text-ink/70">
                  TA {record.ta || "—"} · FC {record.fc || "—"} · FR{" "}
                  {record.fr || "—"} · T° {record.temperatura || "—"} ·
                  SpO2 {record.spo2 || "—"}
                </p>
              </div>
            )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {section.fields.map(([key, label]) =>
              record[key] ? (
                <div key={key}>
                  <dt className="text-xs text-ink/45 mb-1">
                    {label}
                  </dt>

                  <dd className="text-sm text-ink/85 whitespace-pre-wrap">
                    {record[key]}
                  </dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

      </div>
    </div>
  );
}