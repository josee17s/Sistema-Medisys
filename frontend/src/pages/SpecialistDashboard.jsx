import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Ban,
  Power,
  Printer,
  ArrowLeft,
  FileText,
  UserCircle,
} from "lucide-react";

import Shell from "../components/Shell.jsx";
import {
  PageHeader,
  Badge,
  EmptyState,
  Modal,
  fmtDate,
  fmtDateTime,
  SPECIALTY_LABELS,
  SPECIALTY_COLORS,
} from "../components/Ui.jsx";

import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PatientForm from "../components/PatientForm.jsx";
import RecordForms from "../components/RecordForms.jsx";
import PrintableChart from "../components/PrintableChart.jsx";
import PrintableRecord from "../components/PrintableRecord.jsx";
import MiPerfil from "../components/myprofile.jsx";


const NAV = [
  { key: "pacientes", label: "Pacientes", icon: Users },
  { key: "perfil", label: "Mi perfil", icon: UserCircle },
];

export default function SpecialistDashboard() {
  const [tab, setTab] = useState("pacientes");
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId) {
    return (
      <Shell
        items={NAV}
        activeKey={tab}
        onSelect={(k) => {
          setSelectedId(null);
          setTab(k);
        }}
      >
        <PatientDetail
          patientId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      </Shell>
    );
  }

  return (
    <Shell items={NAV} activeKey={tab} onSelect={setTab}>
      {tab === "pacientes" && (
        <MisPacientes onOpen={setSelectedId} />
      )}

      {tab === "perfil" && <MiPerfil />}
    </Shell>
  );
}


// ---------------- Pacientes ----------------

function MisPacientes({ onOpen }) {
  const [list, setList] = useState(null);
  const [modal, setModal] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [q, setQ] = useState("");

  const load = () =>
    api
      .get(`/api/patients?include_inactive=true`)
      .then(setList);

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (p) => {
    try {
      if (p.is_active) {
        await api.delete(`/api/patients/${p.id}`);
      } else {
        await api.patch(`/api/patients/${p.id}/reactivate`);
      }

      load();
    } catch (err) {
      console.error(err);
    }
  };

  const normalizedQuery = q.trim().toLowerCase();

  const visibleList = (list || []).filter((p) => {
    if (!showInactive && !p.is_active) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const nombreCompleto = [
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matricula = String(p.matricula || "").toLowerCase();
    const correo = String(p.correo || "").toLowerCase();
    const disciplina = String(
      p.discipline?.nombre || ""
    ).toLowerCase();

    return (
      nombreCompleto.includes(normalizedQuery) ||
      matricula.includes(normalizedQuery) ||
      correo.includes(normalizedQuery) ||
      disciplina.includes(normalizedQuery)
    );
  });

  return (
    <>
      <PageHeader
        title="Pacientes"
        subtitle="Consulta, edita y administra todos los pacientes registrados en el sistema."
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-ink/60 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) =>
                  setShowInactive(e.target.checked)
                }
              />

              Mostrar inactivos
            </label>

            <button
              className="btn-primary"
              onClick={() =>
                setModal({ mode: "create" })
              }
            >
              <Plus size={16} />
              Nuevo paciente
            </button>
          </div>
        }
      />

      <div className="px-8 pb-8">

        {/* Buscador */}
        <div className="relative mb-4 max-w-md">
          {!q && (
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30"
            />
          )}

          <input
            className="field-input pl-9"
            placeholder="     Buscar por nombre, matrícula, correo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {list === null ? null : visibleList.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              q
                ? "Sin resultados"
                : "No hay pacientes registrados"
            }
            description={
              q
                ? "Intenta con otro nombre, matrícula o correo."
                : "Registra un nuevo paciente para comenzar."
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="text-left text-xs text-ink/50 border-b border-clinic-border">

                    <th className="px-5 py-3 font-medium">
                      Paciente
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Matrícula
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Correo
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Disciplina
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Edad
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Estado
                    </th>

                    <th className="px-5 py-3 font-medium text-right">
                      Acciones
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-clinic-border">

                  {visibleList.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-clinic-bg/60 ${
                        !p.is_active
                          ? "opacity-60"
                          : ""
                      }`}
                    >

                      <td className="px-5 py-3">
                        <button
                          onClick={() => onOpen(p.id)}
                          className="text-ink font-medium hover:text-clinic-primary text-left"
                        >
                          {p.nombres}{" "}
                          {p.apellido_paterno}{" "}
                          {p.apellido_materno}
                        </button>
                      </td>

                      <td className="px-5 py-3 text-ink/70">
                        {p.matricula}
                      </td>

                      <td className="px-5 py-3 text-ink/70">
                        {p.correo || "—"}
                      </td>

                      <td className="px-5 py-3 text-ink/70">
                        {p.discipline?.nombre || "—"}
                      </td>

                      <td className="px-5 py-3 text-ink/70">
                        {p.edad ?? "—"}
                      </td>

                      <td className="px-5 py-3">
                        {p.is_active ? (
                          <Badge tone="green">
                            Activo
                          </Badge>
                        ) : (
                          <Badge tone="red">
                            Inactivo
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">

                          {/* Historial: siempre disponible */}
                          <button
                            className="btn-secondary text-xs py-1.5 px-3"
                            onClick={() =>
                              onOpen(p.id)
                            }
                          >
                            <FileText size={13} />
                            Ver historial
                          </button>

                          {/* Datos generales:
                              solamente para pacientes activos */}
                          {p.is_active && (
                            <button
                              className="btn-secondary text-xs py-1.5 px-3"
                              onClick={() =>
                                setModal({
                                  mode: "edit",
                                  patient: p,
                                })
                              }
                            >
                              Editar
                            </button>
                          )}

                          {/* Baja / Activar */}
                          <button
                            onClick={() =>
                              toggleActive(p)
                            }
                            className={
                              p.is_active
                                ? "btn-danger"
                                : "btn-secondary text-xs py-1.5 px-3"
                            }
                          >
                            {p.is_active ? (
                              <Ban size={13} />
                            ) : (
                              <Power size={13} />
                            )}

                            {p.is_active
                              ? "Baja"
                              : "Activar"}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <PatientForm
          mode={modal.mode}
          patient={modal.patient}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </>
  );
}


// ---------------- Detalle / Expediente unificado ----------------

const TABS = [
  "medicina",
  "odontologia",
  "psicologia",
  "fisioterapia",
  "nutricion",
];

function PatientDetail({ patientId, onBack }) {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("medicina");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [printing, setPrinting] = useState(false);

  // Nota individual que queremos imprimir.
  const [printingRecord, setPrintingRecord] = useState(null);

  const load = () =>
    api
      .get(`/api/records/unified/${patientId}`)
      .then(setData);

  useEffect(() => {
    load();
  }, [patientId]);

  useEffect(() => {
    if (data && user?.specialty?.tipo) {
      setTab(user.specialty.tipo);
    }
  }, [data]);

  if (!data) return null;

  const { patient } = data;
  const myType = user?.specialty?.tipo;

  // Imprimir expediente completo.
  // Disponible aunque el paciente esté inactivo.
  if (printing) {
    return (
      <PrintableChart
        data={data}
        onClose={() => setPrinting(false)}
      />
    );
  }

  // Imprimir solamente una nota.
  // Disponible aunque el paciente esté inactivo.
  if (printingRecord) {
    return (
      <PrintableRecord
        patient={patient}
        type={tab}
        record={printingRecord}
        onClose={() => setPrintingRecord(null)}
      />
    );
  }

  return (
    <>
      <div className="px-8 pt-8 pb-4 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-4"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-black text-2xl text-ink">
              {patient.nombres} {patient.apellido_paterno}{" "}
              {patient.apellido_materno}
            </h1>

            <p className="text-sm text-ink/60 mt-1">
              Matrícula {patient.matricula} ·{" "}
              {patient.edad
                ? `${patient.edad} años`
                : "Edad no registrada"}{" "}
              · {patient.discipline?.nombre || "Sin disciplina"}{" "}
              {patient.trainer
                ? `· Entr. ${patient.trainer.nombre}`
                : ""}
            </p>
          </div>

          {/* Imprimir expediente:
              siempre disponible */}
          <button
            className="btn-secondary"
            onClick={() => setPrinting(true)}
          >
            <Printer size={20} />
            Imprimir expediente
          </button>
        </div>
      </div>

      <div className="px-8 no-print">
        <div className="flex gap-1 border-b border-clinic-border mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t
                  ? "border-clinic-primary text-ink"
                  : "border-transparent text-ink/45 hover:text-ink"
              }`}
            >
              {SPECIALTY_LABELS[t]}

              <span className="ml-1.5 text-xs text-ink/35">
                ({data[t]?.length ?? 0})
              </span>
            </button>
          ))}
        </div>

        <div className="pb-10">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`font-medium text-sm ${SPECIALTY_COLORS[tab]}`}
            >
              {SPECIALTY_LABELS[tab]}
            </h3>

            {/* Nueva nota:
                solamente si el paciente está activo
                y la pestaña corresponde a mi especialidad */}
            {patient.is_active && myType === tab && (
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={() => setFormOpen(true)}
              >
                <Plus size={20} />
                Nueva nota
              </button>
            )}
          </div>

          <RecordList
            type={tab}
            records={data[tab]}
            canEdit={patient.is_active && myType === tab}
            currentUserId={user?.id}
            onEdit={(record) =>
              setEditingRecord(record)
            }
            onPrint={(record) =>
              setPrintingRecord(record)
            }
          />
        </div>
      </div>

      {/* Formulario para crear nota.
          Solamente se abre para pacientes activos. */}
      {formOpen && patient.is_active && (
        <RecordForms
          type={tab}
          patientId={patientId}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}

      {/* Formulario para editar nota.
          Solamente se abre para pacientes activos. */}
      {editingRecord && patient.is_active && (
        <RecordForms
          type={tab}
          patientId={patientId}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null);
            load();
          }}
        />
      )}
    </>
  );
}


// ---------------- Lista de notas ----------------

function RecordList({
  type,
  records,
  canEdit,
  currentUserId,
  onEdit,
  onPrint,
}) {
  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin registros"
        description="Todavía no hay notas de esta especialidad para este paciente."
      />
    );
  }

  const fieldsByType = {
    medicina: [
      ["Ubicación", "ubicacion"],
      ["Motivo", "motivo"],
      ["Servicio", "servicio"],
      ["Diagnóstico", "diagnostico"],
      ["Plan", "plan"],
    ],

    odontologia: [
      ["Observaciones", "observaciones"],
    ],

    psicologia: [
      ["Motivo de consulta", "motivo_consulta"],
    ],

    fisioterapia: [
      ["Diagnóstico", "diagnostico"],
      ["Tratamiento", "tratamiento"],
    ],

    nutricion: [
      ["Tipo de dieta", "tipo_dieta"],
      ["Hidratación", "hidratacion"],
      ["Descanso", "descanso"],
      ["Composición corporal", "composicion_corporal"],
      ["Comida", "comida"],
      ["Suplementación", "suplementacion"],
      ["Recomendaciones", "recomendaciones"],
    ],
  };

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <div key={r.id} className="card p-4">

          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-ink/45">
              <span>
                {fmtDateTime(r.fecha)}
              </span>

              <span className="mx-2">·</span>

              <span>
                Especialista:{" "}
                {r.specialist
                  ? `${r.specialist.nombre} ${r.specialist.apellido_paterno}${
                      r.specialist.apellido_materno
                        ? ` ${r.specialist.apellido_materno}`
                        : ""
                    }`
                  : "No disponible"}
              </span>
            </div>

            <div className="flex items-center gap-3">

              {type === "medicina" &&
                (r.ta ||
                  r.fc ||
                  r.fr ||
                  r.temperatura ||
                  r.spo2) && (
                  <span className="text-xs text-ink/45">
                    TA {r.ta || "—"} · FC {r.fc || "—"} · FR{" "}
                    {r.fr || "—"} · T° {r.temperatura || "—"} ·
                    SpO2 {r.spo2 || "—"}
                  </span>
                )}

              {/* Imprimir:
                  cualquier especialista puede imprimir,
                  incluso si el paciente está inactivo */}
              <button
                onClick={() => onPrint(r)}
                className="text-ink/50 hover:text-ink shrink-0"
                title="Imprimir esta nota"
              >
                <Printer size={20} />
              </button>

              {/* Editar:
                  paciente activo + mi especialidad + soy el autor */}
              {canEdit &&
                r.specialist_id === currentUserId && (
                  <button
                    onClick={() => onEdit(r)}
                    className="text-sm font-medium text-clinic-primary hover:underline shrink-0"
                  >
                    Editar
                  </button>
                )}
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {fieldsByType[type].map(([label, key]) =>
              r[key] ? (
                <div key={key}>
                  <dt className="text-xs text-ink/45">
                    {label}
                  </dt>

                  <dd className="text-sm text-ink/85">
                    {r[key]}
                  </dd>
                </div>
              ) : null
            )}
          </dl>

          {/* Archivos de Nutrición:
              se mantienen exactamente disponibles */}
          {type === "nutricion" &&
            (r.antropometria_file ||
              r.bioimpedancia_file) && (
              <div className="flex gap-3 mt-2 pt-2 border-t border-clinic-border/70">

                {r.antropometria_file && (
                  <a
                    href={r.antropometria_file}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-clinic-primary hover:underline"
                  >
                    Ver antropometría
                  </a>
                )}

                {r.bioimpedancia_file && (
                  <a
                    href={r.bioimpedancia_file}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-clinic-primary hover:underline"
                  >
                    Ver bioimpedancia
                  </a>
                )}

              </div>
            )}
        </div>
      ))}
    </div>
  );
}