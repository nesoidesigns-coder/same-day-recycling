const STATUS_COLORS = {
  new: "#f59e0b",
  confirmed: "#38bdf8",
  scheduled: "#0ea5e9",
  completed: "#1d9e56",
  cancelled: "#ef4444",
};

export default function StatusBar({ bookings }) {
  const counts = {};
  for (const b of bookings || []) {
    const s = b.status || "new";
    counts[s] = (counts[s] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = Object.entries(counts).filter(([, c]) => c > 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#0c3b24] mb-4">Jobs by status</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-500 py-4">No bookings recorded yet — statuses appear here as jobs come in.</p>
      ) : (
        <>
          <div className="flex h-3.5 rounded-full overflow-hidden bg-slate-100">
            {entries.map(([s, c]) => (
              <div key={s} style={{ width: `${(c / total) * 100}%`, backgroundColor: STATUS_COLORS[s] || "#94a3b8" }} title={`${s}: ${c}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
            {entries.map(([s, c]) => (
              <span key={s} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] || "#94a3b8" }} />
                <span className="capitalize">{s}</span> · {c}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}