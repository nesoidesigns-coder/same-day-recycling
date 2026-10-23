import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2, Users, Plus, CheckCircle2, AlertTriangle, Truck, Power } from "lucide-react";

export default function AdminPartners() {
  const [partners, setPartners] = useState(null);
  const [jobCounts, setJobCounts] = useState({});
  const [form, setForm] = useState({ name: "", email: "", city: "", equipment: [] });
  const [saving, setSaving] = useState(false);

  const EQUIPMENT_OPTIONS = ["Pickup truck", "Pickup + trailer", "1-ton + dump trailer", "Full dump truck", "Bin / container rental", "Pallet jack / lifting gear"];

  const load = async () => {
    const { items } = await base44.entities.Partner.filter({}, { sort: "-created_date", limit: 200 });
    setPartners(items);
    const agg = await base44.entities.Booking.aggregate({ query: { status: { $ne: "cancelled" } }, groupBy: "partner_name", sum: ["job_value"] });
    setJobCounts(Object.fromEntries((agg.rows || []).map((r) => [r.partner_name, { jobs: r.count, value: r.sum_job_value || 0 }])));
  };

  useEffect(() => { load().catch(() => setPartners([])); }, []);

  const add = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.city) return;
    setSaving(true);
    try {
      await base44.users.inviteUser(form.email.trim(), "user");
    } catch {
      // already invited or already a user — partner record still gets created
    }
    await base44.entities.Partner.create({ name: form.name.trim(), email: form.email.trim(), city: form.city, equipment: form.equipment, active: true });
    setForm({ name: "", email: "", city: "", equipment: [] });
    setSaving(false);
    load();
  };

  const toggleActive = async (p) => {
    await base44.entities.Partner.update(p.id, { active: p.active === false });
    load();
  };

  if (partners === null) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  const activeCount = partners.filter((p) => p.active !== false).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Partners</h1>
        <p className="text-sm text-slate-500 mt-1">{activeCount} of {partners.length} partner contractors available for dispatch</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
          {partners.length === 0 ? (
            <p className="text-slate-500 text-sm rounded-2xl bg-white border border-slate-200/70 p-8 text-center sm:col-span-2">
              No partners yet — add one on the right to open a dispatch territory.
            </p>
          ) : (
            partners.map((p) => {
              const stats = jobCounts[p.name] || { jobs: 0, value: 0 };
              const incomplete = !p.city || !p.email;
              return (
                <div key={p.id} className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#102B2A]">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.email}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.active !== false ? "bg-[#187B65]/15 text-[#187B65]" : "bg-slate-100 text-slate-500"}`}>
                      {p.active !== false ? "Available" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#102B2A] mt-2">{p.city || "No city set"}</div>
                  {p.equipment?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.equipment.map((eq) => (
                        <span key={eq} className="flex items-center gap-1 rounded-full bg-[#eef4f0] text-[#102B2A] px-2 py-0.5 text-[11px] font-semibold">
                          <Truck className="w-3 h-3 text-[#187B65]" />{eq}
                        </span>
                      ))}
                    </div>
                  )}
                  {incomplete && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" /> Incomplete profile
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{stats.jobs} active job{stats.jobs === 1 ? "" : "s"} · ${Math.round(stats.value).toLocaleString()} value</span>
                    <button
                      onClick={() => toggleActive(p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${p.active !== false ? "border border-slate-200 text-slate-600 hover:border-[#187B65]" : "bg-[#187B65] text-[#102B2A]"}`}
                    >
                      <Power className="w-3 h-3" /> {p.active !== false ? "Pause" : "Reactivate"}
                    </button>
                  </div>
                  <label className="flex items-center justify-between gap-2 mt-3 text-xs font-semibold text-slate-500">
                    Auto-dispatch
                    <select
                      value={p.dispatch_mode === "manual_only" ? "manual_only" : "auto"}
                      onChange={(e) => base44.entities.Partner.update(p.id, { dispatch_mode: e.target.value }).then(load)}
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                    >
                      <option value="auto">Auto — receive job offers</option>
                      <option value="manual_only">Manual only — admin assigns</option>
                    </select>
                  </label>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2"><Users className="w-5 h-5 text-[#187B65]" /> Add a partner</h2>
          <p className="text-sm text-slate-500 mt-1">Sends a login invite, then lists them for dispatch.</p>
          <div className="mt-4 space-y-3">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Company / partner name" aria-label="Partner name" />
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" className="input" placeholder="Login email" aria-label="Partner email" />
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="input" aria-label="Partner city">
              <option value="">Select their city…</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Equipment</div>
              <div className="space-y-1.5">
                {EQUIPMENT_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(item)}
                      onChange={() => setForm((f) => ({ ...f, equipment: f.equipment.includes(item) ? f.equipment.filter((x) => x !== item) : [...f.equipment, item] }))}
                      className="w-4 h-4 accent-[#187B65]"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={add} disabled={saving} className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {saving ? "Adding…" : "Add partner & send invite"}
            </button>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#187B65]" /> Contractors can also self-register at /partner-register — their account links automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}