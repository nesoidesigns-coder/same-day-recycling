import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, Plus } from "lucide-react";

export default function CustomersTab({ license, customers, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", notes: "" });

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    await base44.entities.LicenseCustomer.create({ license_email: license.email, ...form });
    setForm({ name: "", email: "", phone: "", address: "", city: "", notes: "" });
    setAdding(false);
    setBusy(false);
    onChanged();
  };

  const toggleActive = async (c) => {
    setBusy(true);
    await base44.entities.LicenseCustomer.update(c.id, { active: !c.active });
    setBusy(false);
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#0c3b24]">Customers ({customers.length})</h2>
        <button onClick={() => setAdding(!adding)} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-4 py-2 text-sm hover:bg-[#17a04c] transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add customer
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="rounded-2xl bg-white border border-slate-100 p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Customer name" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="Phone" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="Email" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="City" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input sm:col-span-2" placeholder="Address" />
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input sm:col-span-2" placeholder="Notes (materials, access, preferences)" />
          <button disabled={busy} className="rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-3 text-sm sm:col-span-2 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save customer
          </button>
        </form>
      )}

      {customers.length === 0 ? (
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-10 text-center text-slate-500">No customers yet — add your first one.</div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-[#0c3b24]">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{[c.phone, c.email, c.address, c.city].filter(Boolean).join(" · ") || "No contact details"}</div>
                {c.notes && <div className="text-xs text-slate-400 mt-1 italic">{c.notes}</div>}
              </div>
              <button onClick={() => toggleActive(c)} disabled={busy} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${c.active ? "bg-[#1d9e56]/15 text-[#1d9e56]" : "bg-slate-200 text-slate-500"} disabled:opacity-60`}>
                {c.active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}