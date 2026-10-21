import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Play, Trash2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Admin card: runs the booking -> contractor assignment -> dispatch email
// simulation and reports the end-to-end result.
export default function DispatchSimCard() {
  const [recipient, setRecipient] = useState("");
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [simCount, setSimCount] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Booking.filter(
        { record_type: "internal_test", name: "SIM TEST Customer" },
        { limit: 100 }
      );
      setSimCount(items.length);
    })().catch(() => setSimCount(0));
  }, []);

  const run = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("dispatchSimulation", {
        action: "run",
        ...(recipient.trim() ? { recipient: recipient.trim() } : {}),
      });
      setResult(res.data);
      setSimCount((c) => (c ?? 0) + 1);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Simulation failed.");
    } finally {
      setRunning(false);
    }
  };

  const cleanup = async () => {
    setCleaning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("dispatchSimulation", { action: "cleanup" });
      setResult({ cleanup: true, removed_bookings: res.data.removed_bookings, removed_mock_partners: res.data.removed_mock_partners });
      setSimCount(0);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Cleanup failed.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-bold text-[#102B2A] flex items-center gap-2">
            <Play className="w-4 h-4 text-[#187B65]" /> Dispatch simulation
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Creates a mock booking (marked as a test, so it never appears in live metrics), assigns it to a
            contractor, and sends the dispatch confirmation email — verifying the full booking-to-contractor
            communication path.
          </p>
        </div>
        {simCount !== null && simCount > 0 && (
          <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5">{simCount} sim booking(s) on file</span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-56">
          <span className="block text-xs font-semibold text-[#102B2A] mb-1">Send email to (optional override)</span>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Leave blank to use the contractor's email"
            className="text-sm"
          />
        </label>
        <Button onClick={run} disabled={running} className="bg-[#187B65] hover:bg-[#125C4E] text-white font-bold rounded-full">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run simulation
        </Button>
        <Button onClick={cleanup} disabled={cleaning} variant="outline" className="font-bold rounded-full">
          {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clean up test data
        </Button>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> {error}</p>}
      {result && !result.cleanup && (
        <div className="mt-4 rounded-xl bg-[#f4f7f5] border border-slate-100 p-4 text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#102B2A]">
            {result.email_status === "sent" ? (
              <CheckCircle2 className="w-4 h-4 text-[#187B65]" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            {result.email_status === "sent" ? "Dispatch confirmation email sent" : "Email failed"}
            <span className="text-xs font-semibold text-slate-400">ref {result.sim_ref}</span>
          </div>
          <div className="text-slate-600 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> To: {result.email_to} · Contractor: {result.partner}
            {result.mock_partner_created ? " (mock contractor auto-created)" : ""}
          </div>
          <div className="text-slate-500 text-xs">
            Mock booking created and assigned (test record — excluded from live metrics and dispatch).
          </div>
          {result.error && <div className="text-xs text-red-600">{result.error}</div>}
        </div>
      )}
      {result && result.cleanup && (
        <p className="mt-3 text-sm font-semibold text-[#187B65]">
          Cleaned up: {result.removed_bookings} simulation booking(s){result.removed_mock_partners ? ` and ${result.removed_mock_partners} mock contractor(s)` : ""} removed.
        </p>
      )}
    </div>
  );
}