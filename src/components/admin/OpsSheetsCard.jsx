import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, Table2, Loader2 } from "lucide-react";

// Operations tracker card: Google Sheets auto-push for new bookings.
export default function OpsSheetsCard() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justSetUp, setJustSetUp] = useState(false);

  const load = async () => {
    const { items } = await base44.entities.OpsSheetsSettings.list({ limit: 1 });
    setSettings(items[0] || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setUp = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("opsSheetsSync", { action: "setup" });
      if (res.data?.error) setError(res.data.error);
      else setJustSetUp(true);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("opsSheetsSync", { action: "toggle" });
      if (res.data?.error) setError(res.data.error);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <Table2 className="w-4 h-4 text-[#187B65] mt-1 shrink-0" />
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">Ops tracker (Google Sheets)</h2>
          <p className="text-xs text-slate-500 mt-1">
            {settings?.spreadsheet_url
              ? settings.enabled
                ? "On — every new booking is appended to the operations spreadsheet automatically."
                : "Paused — new bookings are not being pushed until re-enabled."
              : "Connect a spreadsheet so the ops team can track every new service request."}
            {justSetUp && " Tracker created and recent bookings backfilled."}
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      {busy ? (
        <Loader2 className="w-5 h-5 text-[#187B65] animate-spin shrink-0" />
      ) : settings?.spreadsheet_url ? (
        <div className="flex gap-2 shrink-0">
          <a href={settings.spreadsheet_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-li-btn text-white font-bold px-4 py-2 text-xs hover:bg-li-btn-hover">
            <ExternalLink className="w-3.5 h-3.5" /> Open tracker
          </a>
          <button onClick={toggle} className="rounded-full border border-slate-200 text-slate-600 font-bold px-4 py-2 text-xs hover:border-[#187B65]">
            {settings.enabled ? "Pause" : "Resume"}
          </button>
        </div>
      ) : (
        <button onClick={setUp} className="rounded-full bg-li-btn text-white font-bold px-4 py-2 text-xs hover:bg-li-btn-hover shrink-0">
          Set up tracker
        </button>
      )}
    </div>
  );
}