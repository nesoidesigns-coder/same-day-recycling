// Living Infrastructure — contractor operations preview. Clearly labelled
// demonstration with sample data for visitors evaluating the software.
const PANELS = [
  { title: "Lead pipeline", rows: [["New inquiries", "4"], ["Quotes sent", "3"], ["Awaiting approval", "2"]] },
  { title: "Territory intelligence", rows: [["Vancouver", "Confirmed"], ["Burnaby", "Matching"], ["Richmond", "Open"]] },
  { title: "Dispatch status", rows: [["Scheduled today", "2"], ["En route", "1"], ["Completed", "3"]] },
  { title: "Revenue tracking", rows: [["This week", "$2,140"], ["Commission", "$428"], ["Paid out", "$1,712"]] },
  { title: "Customer management", rows: [["Repeat customers", "12"], ["Reviews requested", "5"], ["Follow-ups due", "2"]] },
];

export default function ContractorOperationsPreview() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PANELS.map((p) => (
          <div key={p.title} className="rounded-[14px] border border-white/10 bg-white/5 p-4">
            <div className="font-plex text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">{p.title}</div>
            <div className="mt-2 space-y-1.5">
              {p.rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-100/70">{k}</span>
                  <span className="font-plex font-semibold text-white tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-[14px] border border-dashed border-emerald-400/30 bg-white/5 p-4 flex items-center justify-center">
          <p className="text-center text-xs text-emerald-100/60">Live panels appear here for signed-in contractors, from their own operational records.</p>
        </div>
      </div>
      <p className="font-plex mt-3 text-[11px] text-emerald-100/50">Illustrative demonstration using sample data — not live transactions.</p>
    </div>
  );
}