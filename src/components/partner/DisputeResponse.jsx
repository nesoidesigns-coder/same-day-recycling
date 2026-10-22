import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquareWarning } from "lucide-react";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

export default function DisputeResponse() {
  const [disputes, setDisputes] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("partnerPortal", { action: "disputes" });
        setDisputes(res.data.disputes || []);
      } catch {
        setDisputes([]);
      }
    })();
  }, []);

  if (!disputes || disputes.length === 0) return null;

  const send = async (id) => {
    const text = (drafts[id] || "").trim();
    if (!text) return;
    setSaving(id);
    setNote("");
    try {
      await base44.functions.invoke("partnerPortal", { action: "dispute_response", dispute_id: id, response: text });
      setDisputes((ds) => ds.map((d) => (d.id === id ? { ...d, contractor_response: text } : d)));
      setDrafts((x) => ({ ...x, [id]: "" }));
      setNote("Response saved. The review team will see it in your case file.");
    } catch (e) {
      setNote(e?.response?.data?.error || "Could not save the response. Try again.");
    }
    setSaving("");
  };

  return (
    <div className={`${panel} p-6 mb-10`}>
      <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#187B65]/50" />
      <div className={`${label} flex items-center gap-2 mb-2`}>
        <MessageSquareWarning className="w-3.5 h-3.5 text-[#187B65]" /> Open disputes on your jobs
      </div>
      <p className="text-xs text-emerald-100/40 mb-4">
        Respond or correct the facts. Your reply is added to the case file for review — an unverified complaint never counts against your record.
      </p>
      <div className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-xl border border-[#187B65]/20 bg-[#0a2b1e]/50 p-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-white">{d.job_ref || "Job"}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] bg-amber-400/10 text-amber-300 border border-amber-400/30">
                {d.status}
              </span>
              {d.contractor_response_date && (
                <span className="text-emerald-100/30">responded {d.contractor_response_date}</span>
              )}
            </div>
            <p className="text-sm text-emerald-100/70 mt-2">{d.complaint}</p>
            {d.contractor_response ? (
              <div className="mt-3 rounded-lg border border-[#187B65]/25 bg-[#032015]/60 px-3 py-2 text-xs">
                <span className="font-bold uppercase tracking-[0.15em] text-[10px] text-[#187B65]">Your response · </span>
                <span className="text-emerald-100/70">{d.contractor_response}</span>
              </div>
            ) : (
              <div className="mt-3">
                <textarea
                  value={drafts[d.id] || ""}
                  onChange={(e) => setDrafts((x) => ({ ...x, [d.id]: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  placeholder="Respond or correct the facts…"
                  className="w-full rounded-xl border border-[#187B65]/30 bg-[#032015] px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/30 focus:border-[#187B65] focus:outline-none"
                />
                <button
                  onClick={() => send(d.id)}
                  disabled={saving === d.id || !(drafts[d.id] || "").trim()}
                  className="mt-2 rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2 text-xs hover:bg-[#1FA184] transition-colors disabled:opacity-40"
                >
                  {saving === d.id ? "Saving…" : "Submit response"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {note && <p className="text-xs text-[#187B65] mt-3">{note}</p>}
    </div>
  );
}