import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Users,
  ListTree,
  UserSquare2,
  ScrollText,
  Check,
  Ban,
  Power,
} from "lucide-react";
import Shell from "../components/Shell.jsx";
import { PageHeader, Badge, EmptyState, fmtDateTime, fmtDate, SPECIALTY_LABELS } from "../components/Ui.jsx";
import { api } from "../api/client.js";

const NAV = [
  { key: "solicitudes", label: "Solicitudes", icon: ClipboardCheck },
  { key: "especialistas", label: "Especialistas", icon: Users },
  { key: "catalogos", label: "Catálogos", icon: ListTree },
  { key: "pacientes", label: "Pacientes", icon: UserSquare2 },
  { key: "auditoria", label: "Auditoría", icon: ScrollText },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("solicitudes");

  return (
    <Shell items={NAV} activeKey={tab} onSelect={setTab}>
      {tab === "solicitudes" && <Solicitudes />}
      {tab === "especialistas" && <Especialistas />}
      {tab === "catalogos" && <Catalogos />}
      {tab === "pacientes" && <PacientesGlobal />}
      {tab === "auditoria" && <Auditoria />}
    </Shell>
  );
}

// ---------------- Solicitudes pendientes ----------------

function Solicitudes() {
  const [list, setList] = useState(null);

  const load = () => api.get("/api/admin/specialists?pending_only=true").then(setList);
  useEffect(() => {
    load();
  }, []);

  const decide = async (id) => {
    try {
      await api.patch(`/api/admin/specialists/${id}/approve`, {
        is_approved: true,
      });

      load();
    } catch (error) {
      console.error("Error al aceptar especialista:", error);
    }
  };

  return (
    <>
      <PageHeader title="Solicitudes de registro" subtitle="Aprueba a los especialistas antes de que puedan ingresar al sistema." />
      <div className="px-8 pb-8">
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No hay solicitudes pendientes" description="Cuando un especialista se registre, aparecerá aquí para su validación." />
        ) : (
          <div className="card divide-y divide-clinic-border">
            {list.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {s.nombre} {s.apellido_paterno} {s.apellido_materno}
                  </p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {s.correo} · Matrícula {s.matricula} · {s.specialty?.nombre}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decide(s.id)}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    <Check size={14} />
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Todos los especialistas ----------------

function Especialistas() {
  const [list, setList] = useState(null);

  const load = () => api.get("/api/admin/specialists").then(setList);
  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (s) => {
    await api.patch(`/api/admin/specialists/${s.id}/active`, { is_active: !s.is_active });
    load();
  };

  return (
    <>
      <PageHeader title="Especialistas" subtitle="Da de alta o baja el acceso de cualquier especialista al instante." />
      <div className="px-8 pb-8">
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon={Users} title="Aún no hay especialistas registrados" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-ink/50 border-b border-clinic-border">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Especialidad</th>
                    <th className="px-5 py-3 font-medium">Matrícula</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-border">
                  {list.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3">
                        <p className="text-ink font-medium">{s.nombre} {s.apellido_paterno}</p>
                        <p className="text-xs text-ink/45">{s.correo}</p>
                      </td>
                      <td className="px-5 py-3 text-ink/70">{s.specialty?.nombre || "—"}</td>
                      <td className="px-5 py-3 text-ink/70">{s.matricula}</td>
                      <td className="px-5 py-3">
                        {!s.is_approved ? (
                          <Badge tone="amber">Pendiente</Badge>
                        ) : s.is_active ? (
                          <Badge tone="green">Activo</Badge>
                        ) : (
                          <Badge tone="red">Suspendido</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(s)}
                          className={s.is_active ? "btn-danger" : "btn-secondary text-xs py-1.5 px-3"}
                        >
                          {s.is_active ? <Ban size={13} /> : <Power size={13} />}
                          {s.is_active ? "Dar de baja" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Catálogos ----------------

function Catalogos() {
  const [specialties, setSpecialties] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const load = () => {
    api.get("/api/catalogs/specialties?include_inactive=true").then(setSpecialties);
    api.get("/api/catalogs/disciplines?include_inactive=true").then(setDisciplines);
    api.get("/api/catalogs/trainers?include_inactive=true").then(setTrainers);
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader title="Catálogos" subtitle="Especialidades, disciplinas y entrenadores usados en el sistema." />
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CatalogCard
          title="Especialidades"
          items={specialties}
          onToggle={async (id) => {
            await api.patch(`/api/catalogs/specialties/${id}/toggle`);
            load();
          }}
          onCreate={async (nombre, tipo) => {
            await api.post("/api/catalogs/specialties", { nombre, tipo });
            load();
          }}
          withTipo
        />
        <CatalogCard
          title="Disciplinas deportivas"
          items={disciplines}
          onToggle={async (id) => {
            await api.patch(`/api/catalogs/disciplines/${id}/toggle`);
            load();
          }}
          onCreate={async (nombre) => {
            await api.post("/api/catalogs/disciplines", { nombre });
            load();
          }}
        />
        <CatalogCard
          title="Entrenadores"
          items={trainers}
          onToggle={async (id) => {
            await api.patch(`/api/catalogs/trainers/${id}/toggle`);
            load();
          }}
          onCreate={async (nombre) => {
            await api.post("/api/catalogs/trainers", { nombre });
            load();
          }}
        />
      </div>
    </>
  );
}

const TIPOS = ["medicina", "odontologia", "psicologia", "fisioterapia", "nutricion"];

function CatalogCard({ title, items, onToggle, onCreate, withTipo }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await onCreate(nombre.trim(), tipo);
      setNombre("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-medium text-ink text-sm mb-3">{title}</h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
        {items.length === 0 && <p className="text-xs text-ink/40">Sin registros aún.</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm py-1.5 border-b border-clinic-border/70 last:border-0">
            <div>
              <span className={it.is_active ? "text-ink" : "text-ink/35 line-through"}>{it.nombre}</span>
              {withTipo && <span className="ml-2 text-xs text-ink/40">{SPECIALTY_LABELS[it.tipo]}</span>}
            </div>
            <button onClick={() => onToggle(it.id)} className="text-xs text-clinic-primary hover:underline">
              {it.is_active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-2">
        <input
          className="field-input"
          placeholder="Nuevo nombre..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        {withTipo && (
          <select className="field-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {SPECIALTY_LABELS[t]}
              </option>
            ))}
          </select>
        )}
        <button className="btn-secondary w-full text-xs py-1.5" disabled={saving}>
          Agregar
        </button>
      </form>
    </div>
  );
}

// ---------------- Pacientes globales ----------------

function PacientesGlobal() {
  const [list, setList] = useState(null);

  useEffect(() => {
    api.get("/api/admin/patients").then(setList);
  }, []);

  return (
    <>
      <PageHeader title="Todos los pacientes" subtitle="Vista de solo lectura del listado completo del sistema." />
      <div className="px-8 pb-8">
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon={UserSquare2} title="Aún no hay pacientes registrados" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-ink/50 border-b border-clinic-border">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Matrícula</th>
                    <th className="px-5 py-3 font-medium">Disciplina</th>
                    <th className="px-5 py-3 font-medium">Registrado</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-border">
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-ink font-medium">
                        {p.nombres} {p.apellido_paterno} {p.apellido_materno}
                      </td>
                      <td className="px-5 py-3 text-ink/70">{p.matricula}</td>
                      <td className="px-5 py-3 text-ink/70">{p.discipline?.nombre || "—"}</td>
                      <td className="px-5 py-3 text-ink/70">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3">
                        {p.is_active ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Auditoría ----------------

function Auditoria() {
  const [list, setList] = useState(null);

  useEffect(() => {
    api.get("/api/admin/audit-logs").then(setList);
  }, []);

  const accionLabel = (a) =>
    ({
      LOGIN: ["Inicio de sesión", "green"],
      LOGIN_FAIL: ["Intento fallido", "red"],
      LOGIN_FAIL_INACTIVE: ["Cuenta suspendida", "red"],
      LOGIN_FAIL_PENDING: ["Cuenta pendiente", "amber"],
      LOGOUT: ["Cierre de sesión", "neutral"],
      CREATE_PATIENT: ["Alta de paciente", "green"],
      UPDATE_PATIENT: ["Edición de paciente", "blue"],
      DEACTIVATE_PATIENT: ["Baja de paciente", "red"],
      ACTIVATE_PATIENT: ["Reactivación de paciente", "green"],
      DELETE_HISTORIAL: ["Eliminación de historial", "red"],
    }[a] || [a, "neutral"]);
  return (
    <>
      <PageHeader title="Auditoría de conexiones" subtitle="Registro de inicios y cierres de sesión con fecha, hora e IP." />
      <div className="px-8 pb-8">
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon={ScrollText} title="Sin actividad registrada todavía" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-ink/50 border-b border-clinic-border">
                    <th className="px-5 py-3 font-medium">Correo / matrícula</th>
                    <th className="px-5 py-3 font-medium">Acción</th>
                    <th className="px-5 py-3 font-medium">Dirección IP</th>
                    <th className="px-5 py-3 font-medium">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-border">
                  {list.map((l) => {
                    const [label, tone] = accionLabel(l.accion);
                    return (
                      <tr key={l.id}>
                        <td className="px-5 py-3 text-ink/70">{l.correo_usado || "—"}</td>
                        <td className="px-5 py-3">
                          <Badge tone={tone}>{label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-ink/70">{l.ip_address || "—"}</td>
                        <td className="px-5 py-3 text-ink/70">{fmtDateTime(l.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
