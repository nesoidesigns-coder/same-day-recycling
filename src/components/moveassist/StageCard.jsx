import { useState } from "react";
import { Briefcase, Calculator, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_LABEL = {
  draft: "Planned", estimated: "Estimate ready", requested: "Request sent",
  scheduled: "Contractor assigned", completed: "Completed", cancelled: "Cancelled",
};

// One pickup stage inside a MoveAssist project: labeled estimate, customer
// approval, dispatch through the existing nationwide request endpoint.
export default function StageCard({ stage, project, onChange }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState(stage.quote_estimate ? { text: stage.quote_estimate } : null);

  const getQuote = async () => {
    setBusy("quote"); setError("");
    try {
      const res = await base44.functions.invoke("quoteEstimate", { description: stage.items_description || "Moving cleanout items", city: project.city });
      setQuote({ text: res.data?.range || "Contact dispatch", eighths: res.data?.eighths });
      onChange(stage.id, { quote_estimate: res.data?.range || "", quote_eighths: res.data?.eighths || 0, quote_status: "estimated", status: stage.status === "draft" ? "estimated" : stage.status });
      base44.analytics.track({ eventName: "moveassist_quote_calculated", properties: { stage: stage.id } });
    } catch { setError("Estimate unavailable — try again or ask Rex."); }
    finally { setBusy(""); }
  };

  const requestPickup = async () => {
    setBusy("book"); setError("");
    try {
      const res = await base44.functions.invoke("nationalRequest", {
        name: project.name,
        phone: project.phone,
        email: project.email || "",
        city: project.city,
        province_code: project.province_code || "",
        postal_code: project.postal_code || "",
        service_type: "junk_removal",
        items_description: stage.items_description || (project.inventory || []).map((i) => `${i.quantity} × ${i.item}`).join(", "),
        preferred_date: stage.preferred_date || project.move_date || "",
        notes: `MoveAssist project ${project.reference_code} · stage: ${stage.label}`,
        address: project.address || "",
        pickup_lat: project.pickup_lat,
        pickup_lng: project.pickup_lng,
        pickup_unit: project.pickup_unit || "",
        pickup_location_source: project.pickup_location_source || "",
        access_notes: project.access_instructions || {},
      });
      if (!res.data?.ok || !res.data?.reference_code) throw new Error(res.data?.error || "Request could not be submitted");
      onChange(stage.id, { request_reference: res.data.reference_code, status: "requested", quote_status: "approved" });
      base44.analytics.track({ eventName: "moveassist_stage_requested", properties: { stage: stage.id } });
    } catch (err) { setError(err?.response?.data?.error || err?.message || "Booking failed — please try again."); }
    finally { setBusy(""); }
  };

  const prepareBrief = async () => {
    setBusy("brief"); setError("");
    try {
      const res = await base44.functions.invoke("moveAssist", { action: "brief", reference_code: project.reference_code, stage_id: stage.id });
      if (!res.data?.ok) throw new Error(res.data?.error || "Brief failed");
      setBusy("done");
      setTimeout(() => setBusy(""), 2500);
    } catch { setError("Contractor brief failed — try again."); setBusy(""); }
  };

  return (
    <div className="rounded-2xl border border-market-line bg-market-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold">{stage.label}</h4>
        <span className="rounded-full border border-market-line px-3 py-1 text-xs font-bold text-market-muted">{STATUS_LABEL[stage.status] || stage.status}</span>
      </div>
      {stage.preferred_date && <p className="mt-1 text-sm text-market-muted">Target: {stage.preferred_date}</p>}
      <p className="mt-1 text-sm text-market-muted">{stage.items_description || "Items to be confirmed"}</p>

      {quote && (
        <div className="mt-3 rounded-xl bg-[#102B2A]/60 border border-[#187B65]/25 p-3">
          <div className="text-2xl font-bold">{quote.text} <span className="text-sm font-semibold text-market-muted">CAD (preliminary)</span></div>
          <p className="mt-1 text-xs text-market-muted"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#187B65]" />Estimate only — the contractor confirms the final price with you before work begins.</p>
        </div>
      )}

      {stage.request_reference && (
        <p className="mt-2 text-sm"><CheckCircle2 className="mr-1 inline h-4 w-4 text-[#187B65]" />Request <strong>{stage.request_reference}</strong> sent to dispatch{stage.dispatch_status ? ` · ${stage.dispatch_status.replace(/_/g, " ")}` : ""}{stage.partner_name ? ` · ${stage.partner_name}` : ""}.</p>
      )}

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!quote && <button onClick={getQuote} disabled={!!busy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold hover:border-market-accent disabled:opacity-60">{busy === "quote" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} Get estimate</button>}
        {quote && stage.status !== "requested" && stage.status !== "scheduled" && stage.status !== "completed" && (
          <button onClick={requestPickup} disabled={!!busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-4 text-sm font-bold text-market-bg hover:opacity-90 disabled:opacity-60">{busy === "book" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Approve & request pickup</button>
        )}
        <button onClick={prepareBrief} disabled={!!busy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold hover:border-market-accent disabled:opacity-60">{busy === "brief" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}{busy === "done" ? "Brief ready ✓" : "Prepare contractor brief"}</button>
      </div>
      <p className="mt-2 text-xs text-market-muted">A pickup request is not a confirmed appointment — the contractor must accept, and you'll see their confirmation here.</p>
    </div>
  );
}