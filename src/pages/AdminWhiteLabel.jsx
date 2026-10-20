import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Building2, TrendingUp, ArrowRightCircle } from "lucide-react";

const LEAD_STATUSES = ["new", "contacted", "proposal_sent", "won", "lost"];
const CLIENT_STATUSES = ["onboarding", "active", "paused", "churned"];
const MODE_LABELS = { custom_branding: "Custom branding", full_app: "Full separate app", lead_gen: "Lead-gen split" };

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");

export default function AdminWhiteLabel() {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const [l, c] = await Promise.all([
      base44.entities.WhiteLabelLead.filter({}, { sort: "-created_date", limit: 100 }),
      base44.entities.WhiteLabelClient.filter({}, { sort: "-created_date", limit: 100 }),
    ]);
    setLeads(l.items || l);
    setClients(c.items || c);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const setLeadStatus = async (id, status) => {
    setBusyId(id);
    await base44.entities.WhiteLabelLead.update(id, { status });
    await load();
    setBusyId(null);
  };

  const setClientStatus = async (id, status) => {
    setBusyId(id);
    await base44.entities.WhiteLabelClient.update(id, { status });
    await load();
    setBusyId(null);
  };

  const convert = async (lead) => {
    setBusyId(lead.id);
    await base44.entities.WhiteLabelClient.create({
      company: lead.company,
      contact_name: lead.contact_name,
      email: lead.email,
      mode: lead.mode,
      plan: "starter",
      setup_fee: 2500,
      monthly_fee: 199,
      brand_name: lead.company,
      status: "onboarding",
      notes: lead.message || "",
    });
    await base44.entities.WhiteLabelLead.update(lead.id, { status: "won" });
    setTab("clients");
    await load();
    setBusyId(null);
  };

  const mrr = clients.filter((c) => c.status === "active").reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);
  const pipeline = leads.filter((l) => !["won", "lost"].includes(l.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0c3b24]">White Label Admin</h1>
            <p className="text-slate-600 mt-1">Applications in: {pipeline} · Clients: {clients.length} · MRR: {money(mrr)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("leads")} className={`rounded-full px-5 py-2.5 text-sm font-bold ${tab === "leads" ? "bg-[#0c3b24] text-white" : "bg-white text-[#0c3b24] border border-slate-200"}`}>
              Applications ({leads.length})
            </button>
            <button onClick={() => setTab("clients")} className={`rounded-full px-5 py-2.5 text-sm font-bold ${tab === "clients" ? "bg-[#0c3b24] text-white" : "bg-white text-[#0c3b24] border border-slate-200"}`}>
              Clients ({clients.length})
            </button>
          </div>
        </div>

        {tab === "leads" && (
          <div className="space-y-4">
            {leads.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="mt-3">No applications yet. They arrive from the <a href="/white-label" className="text-[#1d9e56] font-bold">white-label page</a>.</p>
              </div>
            )}
            {leads.map((l) => (
              <div key={l.id} className="rounded-3xl bg-white border border-slate-100 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#0c3b24] text-lg">{l.company}</div>
                    <div className="text-sm text-slate-600">{l.contact_name} · {l.email}{l.phone ? ` · ${l.phone}` : ""}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {l.city || "City n/a"} · {l.fleet_size || 1} truck{(l.fleet_size || 1) > 1 ? "s" : ""} · {MODE_LABELS[l.mode] || l.mode}
                    </div>
                    {l.message && <p className="text-sm text-slate-600 mt-2 italic">"{l.message}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value)} disabled={busyId === l.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-[#0c3b24]">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {!["won", "lost"].includes(l.status) && (
                      <button onClick={() => convert(l)} disabled={busyId === l.id} className="rounded-full bg-[#1d9e56] text-[#0c3b24] px-4 py-2 text-sm font-bold hover:bg-[#17a04c] transition-colors flex items-center gap-1.5 disabled:opacity-60">
                        <ArrowRightCircle className="w-4 h-4" /> Onboard
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "clients" && (
          <div className="space-y-4">
            {clients.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="mt-3">No clients yet. Convert a won application in the Applications tab.</p>
              </div>
            )}
            {clients.map((c) => (
              <div key={c.id} className="rounded-3xl bg-white border border-slate-100 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#0c3b24] text-lg">{c.company}</div>
                    <div className="text-sm text-slate-600">{c.contact_name} · {c.email}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {MODE_LABELS[c.mode] || c.mode} · {c.plan} plan · setup {money(c.setup_fee)} · {money(c.monthly_fee)}/mo
                    </div>
                    {c.notes && <p className="text-sm text-slate-600 mt-2 italic">"{c.notes}"</p>}
                  </div>
                  <select value={c.status} onChange={(e) => setClientStatus(c.id, e.target.value)} disabled={busyId === c.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-[#0c3b24]">
                    {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}