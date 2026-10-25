export const money = (n) => {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-CA", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
};

export const Kpi = ({ label, value, sub, tone = "default", empty }) => (
  <div className={`rounded-xl border p-4 ${tone === "accent" ? "border-brand-emerald/30 bg-brand-softmint/40" : "border-slate-200 bg-white"}`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-[#102B2A]">{empty ? <span className="text-slate-400">—</span> : value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

export const Section = ({ title, note, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-base font-bold text-[#102B2A]">{title}</h3>
    {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

export const EmptyNote = ({ children }) => (
  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{children}</p>
);