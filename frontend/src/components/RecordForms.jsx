import { useState } from "react";
import { Modal } from "./Ui.jsx";
import { api } from "../api/client.js";

const CONFIG = {
  medicina: {
    endpoint: "/api/records/medicina",
    title: "Nueva nota de Medicina",
    vitals: true,
    fields: [
      ["ubicacion", "Ubicación", "text"],
      ["motivo", "Motivo de consulta", "textarea"],
      ["servicio", "Servicio", "text"],
      ["diagnostico", "Diagnóstico", "textarea"],
      ["plan", "Plan", "textarea"],
    ],
  },
  odontologia: {
    endpoint: "/api/records/odontologia",
    title: "Nueva nota de Odontología",
    fields: [["observaciones", "Observaciones", "textarea"]],
  },
  psicologia: {
    endpoint: "/api/records/psicologia",
    title: "Nueva nota de Psicología",
    fields: [["motivo_consulta", "Motivo de consulta", "textarea"]],
  },
  fisioterapia: {
    endpoint: "/api/records/fisioterapia",
    title: "Nueva nota de Fisioterapia",
    fields: [
      ["diagnostico", "Diagnóstico", "textarea"],
      ["tratamiento", "Tratamiento", "textarea"],
    ],
  },
  nutricion: {
    endpoint: "/api/records/nutricion",
    title: "Nueva nota de Nutrición",
    fields: [
      ["tipo_dieta", "Tipo de dieta", "text"],
      ["hidratacion", "Hidratación", "text"],
      ["descanso", "Descanso", "text"],
      ["composicion_corporal", "Composición corporal", "textarea"],
      ["comida", "Comida", "textarea"],
      ["suplementacion", "Suplementación", "textarea"],
      ["recomendaciones", "Recomendaciones", "textarea"],
    ],
    files: true,
  },
};

export default function RecordForms({ type, patientId, record, onClose, onSaved }) {
  const cfg = CONFIG[type];
  const isEdit = Boolean(record);
  const [form, setForm] = useState(() => {
    if (!record) return {};
    const initial = {};
    if (cfg.vitals) {
      ["ta", "fc", "fr", "temperatura", "spo2"].forEach((k) => {
        initial[k] = record[k] || "";
      });
    }
    cfg.fields.forEach(([key]) => {
      initial[key] = record[key] || "";
    });
    return initial;
  });
  const [antropometria, setAntropometria] = useState(null);
  const [bioimpedancia, setBioimpedancia] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = isEdit
        ? await api.put(`${cfg.endpoint}/${record.id}`, { patient_id: patientId, ...form })
        : await api.post(cfg.endpoint, { patient_id: patientId, ...form });
      if (cfg.files) {
        if (antropometria) {
          const fd = new FormData();
          fd.append("file", antropometria);
          await api.postForm(`/api/records/nutricion/${saved.id}/upload/antropometria`, fd);
        }
        if (bioimpedancia) {
          const fd = new FormData();
          fd.append("file", bioimpedancia);
          await api.postForm(`/api/records/nutricion/${saved.id}/upload/bioimpedancia`, fd);
        }
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? cfg.title.replace("Nueva nota", "Editar nota") : cfg.title} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {cfg.vitals && (
          <div>
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Signos vitales</p>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <label className="field-label">TA</label>
                <input className="field-input" placeholder="120/80" value={form.ta || ""} onChange={set("ta")} />
              </div>
              <div>
                <label className="field-label">FC</label>
                <input className="field-input" placeholder="lpm" value={form.fc || ""} onChange={set("fc")} />
              </div>
              <div>
                <label className="field-label">FR</label>
                <input className="field-input" placeholder="rpm" value={form.fr || ""} onChange={set("fr")} />
              </div>
              <div>
                <label className="field-label">Temp.</label>
                <input className="field-input" placeholder="°C" value={form.temperatura || ""} onChange={set("temperatura")} />
              </div>
              <div>
                <label className="field-label">SpO2</label>
                <input className="field-input" placeholder="%" value={form.spo2 || ""} onChange={set("spo2")} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {cfg.fields.map(([key, label, type2]) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              {type2 === "textarea" ? (
                <textarea className="field-input min-h-[80px]" value={form[key] || ""} onChange={set(key)} />
              ) : (
                <input className="field-input" value={form[key] || ""} onChange={set(key)} />
              )}
            </div>
          ))}
        </div>

        {cfg.files && (
          <div className="border-t border-clinic-border pt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Antropometría (archivo)</label>
              <input
                type="file"
                className="text-sm text-ink/70"
                onChange={(e) => setAntropometria(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="field-label">Bioimpedancia (archivo)</label>
              <input
                type="file"
                className="text-sm text-ink/70"
                onChange={(e) => setBioimpedancia(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar nota"}</button>
        </div>
      </form>
    </Modal>
  );
}
