import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function SchedulingTab({ license, customers, pickups, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [form, setForm] = useState({ address: "", city: "", items_description: "", scheduled_date: today(), time_window: "" });

  const pickCustomer = (id) => {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) setForm((f) => ({ ...f, address: c.address || "", city: c.city || "" }));
  };

  const schedule = async (e) => {
    e.preventDefault();
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    setBusy(true);
    await base44.entities.LicensePickup.create({
      license_email: license.email,
      customer_id: c.id,
      customer_name: c.name,
      customer_phone: c.phone || "",
      ...form,
      status: "scheduled",
    });
    setForm({ address: "", city: "", items_description: "", scheduled_date: today(), time_window: "" });
    setCustomerId("");
    setBusy(false);
    onChanged();
  };

  const upcoming = pickups.filter((p) => p.status === "scheduled").sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || ""));

  return (
    <div>
      <h2 className="text-lg font-bold text-[#102B2A] mb-4">Schedule a pickup</h2>
      <form onSubmit={schedule} className="rounded-2xl bg-white border border-slate-100 p-5 grid sm:grid-cols-2 gap-3 mb-6">
        <select required value={customerId} onChange={(e) => pickCustomer(e.target.value)} className="input sm:col-span-2">
          <option value="" disabled>Select customer</option>
          {customers.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Pickup date</label>
          <input required type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Time window</label>
          <input value={form.time_window} onChange={(e) => setForm({ ...form, time_window: e.target.value })} className="input" placeholder="e.g. 9 AM - 12 PM" />
        </div>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" placeholder="Pickup address" />
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="City" />
        <input value={form.items_description} onChange={(e) => setForm({ ...form, items_description: e.target.value })} className="input sm:col-span-2" placeholder="What are we picking up?" />
        <button disabled={busy || !customerId} className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 text-sm sm:col-span-2 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Schedule pickup
        </button>
      </form>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Upcoming ({upcoming.length})</h3>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-8 text-center text-slate-500">Nothing scheduled yet.</div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-[#102B2A]">{p.customer_name} <span className="text-xs font-semibold text-slate-400">{p.scheduled_date}{p.time_window ? ` · ${p.time_window}` : ""}</span></div>
                <div className="text-xs text-slate-500 mt-0.5">{[p.address, p.city].filter(Boolean).join(", ")}</div>
                {p.items_description && <div className="text-xs text-slate-400 mt-1">{p.items_description}</div>}
              </div>
              <span className="rounded-full bg-sky-100 text-sky-700 px-3 py-1 text-xs font-bold">Scheduled</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}