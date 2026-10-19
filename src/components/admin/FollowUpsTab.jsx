import { useState } from "react";
import { Loader2, Copy, CheckCircle2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FollowUpsTab() {
  const [running, setRunning] = useState(false);
  const [followups, setFollowups] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const run = async () => {
    setRunning(true);
    setError("");
    setMessage("");
    try {
      const res = (await base44.functions.invoke("aiFollowUps", {})).data || {};
      setFollowups(res.followups || []);
      setMessage(res.message || "");
    } catch (e) {
      setError(e?.message || "Follow-up sweep failed");
    }
    setRunning(false);
  };

  const copy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5">
      <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-[#1d9e56]" /> Lead-chasing AI
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Every morning at 8am, the AI emails closing follow-ups straight to open leads and unconfirmed bookings (up to 3 rounds: warm close, objection handling, final nudge), then escalates anyone still open to you for a personal call. Run a sweep right now to send the next round.
      </p>
      <button
        onClick={run}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-full bg-[#1d9e56] text-white font-bold px-6 py-3 text-sm hover:bg-[#17a04c] transition-colors disabled:opacity-60"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {running ? "AI is drafting…" : "Run follow-up sweep now"}
      </button>
      {message && <p className="text-sm text-slate-600 mt-3">{message}</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {followups?.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {followups.map((f, i) => (
            <div key={f.id || i} className="rounded-xl bg-[#f4f7f5] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#0c3b24]">
                  <span className="rounded-full bg-[#1d9e56]/15 px-2 py-0.5 text-[11px] font-bold mr-2">
                    {f.kind === "booking" ? "Booking" : "Realtor lead"}
                  </span>
                  {f.name}
                  {f.round ? <span className="ml-2 text-[11px] font-bold text-slate-400">Round {f.round}</span> : null}
                </p>
                <button
                  onClick={() => copy(f.message, f.id || i)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d9e56] hover:underline"
                >
                  {copied === (f.id || i) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === (f.id || i) ? "Copied" : "Copy message"}
                </button>
              </div>
              <p className="text-sm text-slate-700 mt-2">{f.message}</p>
            </div>
          ))}
        </div>
      )}
      {followups && followups.length === 0 && !message && (
        <p className="text-sm text-slate-500 mt-4">No open leads right now.</p>
      )}
    </div>
  );
}