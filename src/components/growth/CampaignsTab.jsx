import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Section, EmptyNote, money } from "./growthShared";

const STATUS_STYLES = {
  proposed: "bg-slate-100 text-slate-600", pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-brand-softmint text-[#102B2A]", paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-emerald-600/10 text-emerald-700", declined: "bg-red-100 text-red-600", cancelled: "bg-red-100 text-red-600",
};

export default function CampaignsTab({ data, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", target_region: "", target_city: "", service_category: "", planned_monthly_budget: "", lead_cost_estimate: "", conversion_rate_estimate: "", est_monthly_bookings: "", est_platform_commission: "", evidence: "", risk_assessment: "", capacity_note: "" });
  const [saving, setSaving] = useState(false);
  const [spendForm, setSpendForm] = useState({});
  const campaigns = data?.campaigns?.list || [];

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Campaign name required" }); return; }
    setSaving(true);
    try {
      const n = (k) => Number(form[k]) || 0;
      const evidence = form.evidence.trim()
        ? [{ metric: "Owner-entered supporting evidence", value: form.evidence.trim(), source: "owner entry", basis: "verified" }]
        : [];
      await base44.entities.NetworkCampaign.create({
        name: form.name.trim(), status: "proposed",
        target_region: form.target_region.trim(), target_city: form.target_city.trim(),
        service_category: form.service_category.trim(),
        planned_monthly_budget: n("planned_monthly_budget"), lead_cost_estimate: n("lead_cost_estimate"),
        conversion_rate_estimate: n("conversion_rate_estimate"), est_monthly_bookings: n("est_monthly_bookings"),
        est_platform_commission: n("est_platform_commission"),
        evidence, risk_assessment: form.risk_assessment.trim(), capacity_note: form.capacity_note.trim(),
        fulfillment_cities: form.target_city.trim() ? [form.target_city.trim()] : [],
      });
      toast({ title: "Campaign proposal saved", description: "It stays a proposal until you approve activation." });
      setForm({ name: "", target_region: "", target_city: "", service_category: "", planned_monthly_budget: "", lead_cost_estimate: "", conversion_rate_estimate: "", est_monthly_bookings: "", est_platform_commission: "", evidence: "", risk_assessment: "", capacity_note: "" });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (c, status) => {
    const patch = { status };
    if (status === "approved") { patch.approved_by = "owner"; patch.approved_date = new Date().toISOString().slice(0, 10); }
    await base44.entities.NetworkCampaign.update(c.id, patch);
    onSaved?.();
  };

  const recordResults = async (c) => {
    const v = spendForm[c.id] || {};
    await base44.entities.NetworkCampaign.update(c.id, {
      actual_spend: Number(v.actual_spend ?? c.actual_spend) || 0,
      results: {
        inquiries: Number(v.inquiries ?? c.results?.inquiries) || 0,
        qualified_leads: Number(v.qualified_leads ?? c.results?.qualified_leads) || 0,
        bookings: Number(v.bookings ?? c.results?.bookings) || 0,
        completed_jobs: Number(v.completed_jobs ?? c.results?.completed_jobs) || 0,
        platform_commission: Number(v.platform_commission ?? c.results?.platform_commission) || 0,
      },
    });
    toast({ title: "Campaign results recorded" });
    onSaved?.();
  };

  const inp = (ph) => "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <Section title="Campaign proposals" note="Every figure below is a labeled estimate. Activation and spending require owner approval — nothing launches automatically.">
        {campaigns.length === 0 && <EmptyNote>No campaigns proposed yet. Create one below from verified demand evidence.</EmptyNote>}
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#102B2A]">{c.name}</p>
                  <p className="text-xs text-slate-500">{[c.target_city, c.target_region, c.service_category].filter(Boolean).join(" · ") || "No target set"}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[c.status] || "bg-slate-100"}`}>{c.status.replace("_", " ")}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 md:grid-cols-4">
                <span>Planned budget: <b>{money(c.planned_monthly_budget)}</b>/mo</span>
                <span>Lead cost est.: <b>{c.lead_cost_estimate ? money(c.lead_cost_estimate) : "—"}</b></span>
                <span>Conversion est.: <b>{c.conversion_rate_estimate ? `${c.conversion_rate_estimate}%` : "—"}</b></span>
                <span>Bookings est.: <b>{c.est_monthly_bookings || "—"}</b>/mo</span>
              </div>
              {c.capacity_note && <p className="mt-2 text-xs text-slate-500">Fulfillment: {c.capacity_note}</p>}
              {c.risk_assessment && <p className="mt-1 text-xs text-slate-500">Risk: {c.risk_assessment}</p>}
              {c.actual_spend > 0 && (
                <p className="mt-2 text-xs text-[#102B2A]">Actual spend: <b>{money(c.actual_spend)}</b> · attributed: {c.results?.bookings || 0} bookings, {c.results?.completed_jobs || 0} completed{c.attribution_note ? ` (${c.attribution_note})` : ""}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {["proposed", "pending_approval"].includes(c.status) && <>
                  <button onClick={() => setStatus(c, "approved")} className="rounded-lg bg-brand-emerald px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Approve activation</button>
                  <button onClick={() => setStatus(c, "declined")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Decline</button>
                </>}
                {c.status === "approved" && <button onClick={() => setStatus(c, "paused")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#102B2A] hover:bg-slate-50">Pause</button>}
                {c.status === "paused" && <button onClick={() => setStatus(c, "approved")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#102B2A] hover:bg-slate-50">Resume</button>}
                {["completed", "declined", "cancelled"].includes(c.status) && <span className="text-xs text-slate-400">Closed</span>}
              </div>
              {c.status === "approved" && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 md:grid-cols-6">
                  <input className={inp()} placeholder="Spend $" value={spendForm[c.id]?.actual_spend ?? ""} onChange={(e) => setSpendForm({ ...spendForm, [c.id]: { ...spendForm[c.id], actual_spend: e.target.value } })} />
                  <input className={inp()} placeholder="Inquiries" value={spendForm[c.id]?.inquiries ?? ""} onChange={(e) => setSpendForm({ ...spendForm, [c.id]: { ...spendForm[c.id], inquiries: e.target.value } })} />
                  <input className={inp()} placeholder="Qualified" value={spendForm[c.id]?.qualified_leads ?? ""} onChange={(e) => setSpendForm({ ...spendForm, [c.id]: { ...spendForm[c.id], qualified_leads: e.target.value } })} />
                  <input className={inp()} placeholder="Bookings" value={spendForm[c.id]?.bookings ?? ""} onChange={(e) => setSpendForm({ ...spendForm, [c.id]: { ...spendForm[c.id], bookings: e.target.value } })} />
                  <input className={inp()} placeholder="Completed" value={spendForm[c.id]?.completed_jobs ?? ""} onChange={(e) => setSpendForm({ ...spendForm, [c.id]: { ...spendForm[c.id], completed_jobs: e.target.value } })} />
                  <button onClick={() => recordResults(c)} className="rounded-lg bg-[#102B2A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Record results</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Propose a campaign" note="Only propose campaigns where verified contractor capacity exists. Scenarios are estimates, never forecasts of guaranteed results.">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" placeholder="Campaign name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Target city" value={form.target_city} onChange={(e) => setForm({ ...form, target_city: e.target.value })} />
          <input className="input" placeholder="Region (e.g. BC)" value={form.target_region} onChange={(e) => setForm({ ...form, target_region: e.target.value })} />
          <input className="input" placeholder="Service category" value={form.service_category} onChange={(e) => setForm({ ...form, service_category: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Planned monthly budget $" value={form.planned_monthly_budget} onChange={(e) => setForm({ ...form, planned_monthly_budget: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Lead cost estimate $" value={form.lead_cost_estimate} onChange={(e) => setForm({ ...form, lead_cost_estimate: e.target.value })} />
          <input className="input" type="number" min="0" max="100" placeholder="Conversion rate estimate %" value={form.conversion_rate_estimate} onChange={(e) => setForm({ ...form, conversion_rate_estimate: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Estimated monthly bookings" value={form.est_monthly_bookings} onChange={(e) => setForm({ ...form, est_monthly_bookings: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Estimated commission /mo" value={form.est_platform_commission} onChange={(e) => setForm({ ...form, est_platform_commission: e.target.value })} />
          <input className="input md:col-span-2" placeholder="Supporting market evidence (verified sources)" value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} />
          <input className="input" placeholder="Risk assessment" value={form.risk_assessment} onChange={(e) => setForm({ ...form, risk_assessment: e.target.value })} />
        </div>
        <button onClick={save} disabled={saving} className="mt-4 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">{saving ? "Saving…" : "Save campaign proposal"}</button>
      </Section>
    </div>
  );
}