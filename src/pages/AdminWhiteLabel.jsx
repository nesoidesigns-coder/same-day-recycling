import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Users, Building2, TrendingUp, DollarSign, Briefcase,
  ArrowRightCircle,
} from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

const LEAD_STATUSES = ["new", "contacted", "proposal_sent", "won", "lost"];
const CLIENT_STATUSES = ["onboarding", "active", "paused", "churned"];
const MODE_LABELS = { custom_branding: "Custom branding", full_app: "Full separate app", lead_gen: "Lead-gen split" };
const TABS = [
  { key: "leads", label: "Applications" },
  { key: "clients", label: "Clients" },
];

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
  const activeClients = clients.filter((c) => c.status === "active").length;
  const contractValue = clients.reduce((s, c) => s + (Number(c.setup_fee) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  const gauges = [
    { icon: TrendingUp, label: "Monthly recurring", value: money(mrr), sub: `${activeClients} active client${activeClients === 1 ? "" : "s"}` },
    { icon: DollarSign, label: "Setup fees signed", value: money(contractValue), sub: `${clients.length} total client${clients.length === 1 ? "" : "s"}` },
    { icon: Users, label: "Open applications", value: String(pipeline), sub: `${leads.length} all-time` },
    { icon: Briefcase, label: "Won deals", value: String(leads.filter((l) => l.status === "won").length), sub: `${leads.filter((l) => l.status === "lost").length} lost` },
  ];

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight">White Label Control Room</h1>
            <p className="text-sm text-slate-500">Applications pipeline and licensed clients</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {gauges.map((g) => (
            <div key={g.label} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <g.icon className="w-4 h-4 text-[#1d9e56]" />
                <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">{g.label}</div>
              </div>
              <div className="text-2xl font-bold text-[#0c3b24] mt-2">{g.value}</div>
              <div className="text-xs text-slate-500 mt-1">{g.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-2 text-sm"
                  : "rounded-full bg-slate-100 text-slate-700 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors"
              }
            >
              {t.label} ({t.key === "leads" ? leads.length : clients.length})
            </button>
          ))}
          <a href="/white-label" className="rounded-full bg-slate-100 text-slate-700 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors">
            View sales page &rarr;
          </a>
        </div>

        {tab === "leads" && (
          <div className="space-y-4">
            {leads.length === 0 && (
              <div className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-10 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="mt-3">No applications yet — they arrive from the white-label sales page.</p>
              </div>
            )}
            {leads.map((l) => (
              <div key={l.id} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0c3b24] text-lg">{l.company}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${l.status === "won" ? "bg-[#1d9e56]/15 text-[#1d9e56]" : l.status === "lost" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"}`}>{l.status}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">{l.contact_name} · {l.email}{l.phone ? ` · ${l.phone}` : ""}</div>
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
              <div className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-10 text-center text-slate-500">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="mt-3">No clients yet. Convert a won application in the Applications tab.</p>
              </div>
            )}
            {clients.map((c) => (
              <div key={c.id} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0c3b24] text-lg">{c.company}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${c.status === "active" ? "bg-[#1d9e56]/15 text-[#1d9e56]" : c.status === "churned" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"}`}>{c.status}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wide rounded-full bg-[#0c3b24] text-[#1d9e56] px-2.5 py-0.5">{c.plan}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">{c.contact_name} · {c.email}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {MODE_LABELS[c.mode] || c.mode} · setup {money(c.setup_fee)} · {money(c.monthly_fee)}/mo
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
      <Footer />
    </div>
  );
}