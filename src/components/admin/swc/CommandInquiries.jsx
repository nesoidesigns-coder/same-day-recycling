import { Inbox } from "lucide-react";

const STATUSES = ["new", "contacted", "won", "lost"];
const STATUS_STYLES = {
  new: "bg-[#187B65]/15 text-[#54D9AE]",
  contacted: "bg-amber-400/15 text-amber-300",
  won: "bg-emerald-400/15 text-emerald-300",
  lost: "bg-red-400/15 text-red-300",
};

export default function CommandInquiries({ inquiries, onStatusChange, busyId }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl holo-panel-deep border border-[#187B65]/20 p-6">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#187B65]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em]">Enterprise inquiries</h2>
          <span className="ml-auto text-sm text-emerald-100/60 font-bold">{inquiries.length}</span>
        </div>
        <p className="text-sm text-emerald-100/50 mt-2">Inquiries from the Network / enterprise tier on the sales page.</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-2xl holo-panel-deep border border-[#187B65]/20 p-10 text-center text-sm text-emerald-100/50">
          No enterprise inquiries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((q) => (
            <div key={q.id} className="rounded-2xl holo-panel-deep border border-[#187B65]/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white">{q.company}</div>
                  <div className="text-sm text-emerald-100/60">
                    {q.contact_name} · {q.email}
                    {q.phone ? ` · ${q.phone}` : ""}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[q.status] || STATUS_STYLES.new}`}>
                  {q.status}
                </span>
              </div>
              {q.message && <p className="text-sm text-emerald-100/70 mt-3">{q.message}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs text-emerald-100/40 font-semibold">
                  {q.fleet_size ? `${q.fleet_size} vehicles · ` : ""}{q.created_date ? new Date(q.created_date).toLocaleDateString("en-CA") : ""}
                </span>
                <span className="text-xs text-emerald-100/40 font-semibold ml-auto">Set status:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={busyId === q.id || q.status === s}
                    onClick={() => onStatusChange(q.id, s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                      q.status === s ? "bg-[#187B65] text-[#102B2A]" : "border border-[#187B65]/40 text-emerald-100/70 hover:bg-[#187B65]/10"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}