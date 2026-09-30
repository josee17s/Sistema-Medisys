export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-6">
      <div>
        <h1 className="font-display font-black text-2xl text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink/60 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-ink/5 text-ink/70",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <Icon size={28} className="text-ink/25 mb-3" strokeWidth={1.5} />}
      <p className="text-ink/70 font-medium">{title}</p>
      {description && <p className="text-sm text-ink/45 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 no-print">
      <div className={`bg-white rounded-lg border border-clinic-border w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-clinic-border sticky top-0 bg-white">
          <h3 className="font-display font-black text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const SPECIALTY_LABELS = {
  medicina: "Medicina",
  odontologia: "Odontología",
  psicologia: "Psicología",
  fisioterapia: "Fisioterapia",
  nutricion: "Nutrición",
};

export const SPECIALTY_COLORS = {
  medicina: "text-specialty-medicina",
  odontologia: "text-specialty-odontologia",
  psicologia: "text-specialty-psicologia",
  fisioterapia: "text-specialty-fisioterapia",
  nutricion: "text-specialty-nutricion",
};

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}