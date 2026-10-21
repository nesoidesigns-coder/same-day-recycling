import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2 } from "lucide-react";

const MODES = [
  { value: "custom_branding", label: "Custom branding (shared system)" },
  { value: "full_app", label: "Full separate app" },
  { value: "lead_gen", label: "Lead-gen split" },
];

export default function WhiteLabelApplicationForm() {
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", phone: "", city: "", fleet_size: 1, mode: "custom_branding", message: "" });
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    await base44.entities.WhiteLabelLead.create({ ...form, fleet_size: Number(form.fleet_size) || 1 });
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="rounded-3xl bg-[#f4f7f5] border border-[#187B65]/30 p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto" />
        <h3 className="text-2xl font-bold text-[#102B2A] mt-4">Application received</h3>
        <p className="text-slate-600 mt-2">We'll review your business and reply within one business day with a proposal and next steps.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-[#f4f7f5] p-6 md:p-10 grid md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-bold text-[#102B2A]">Company name *</label>
        <input required value={form.company} onChange={set("company")} className="input mt-1" placeholder="Acme Junk Removal Ltd." />
      </div>
      <div>
        <label className="text-sm font-bold text-[#102B2A]">Contact name *</label>
        <input required value={form.contact_name} onChange={set("contact_name")} className="input mt-1" placeholder="Jane Smith" />
      </div>
      <div>
        <label className="text-sm font-bold text-[#102B2A]">Email *</label>
        <input required type="email" value={form.email} onChange={set("email")} className="input mt-1" placeholder="jane@company.ca" />
      </div>
      <div>
        <label className="text-sm font-bold text-[#102B2A]">Phone</label>
        <input value={form.phone} onChange={set("phone")} className="input mt-1" placeholder="(555) 555-1234" />
      </div>
      <div>
        <label className="text-sm font-bold text-[#102B2A]">City / region</label>
        <input value={form.city} onChange={set("city")} className="input mt-1" placeholder="Toronto, ON" />
      </div>
      <div>
        <label className="text-sm font-bold text-[#102B2A]">Trucks in fleet</label>
        <input type="number" min="1" value={form.fleet_size} onChange={set("fleet_size")} className="input mt-1" />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-bold text-[#102B2A]">White-label mode of interest</label>
        <select value={form.mode} onChange={set("mode")} className="input mt-1">
          {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-bold text-[#102B2A]">Anything we should know?</label>
        <textarea rows={3} value={form.message} onChange={set("message")} className="input mt-1 resize-none" placeholder="Current systems, pain points, goals…" />
      </div>
      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">No commitment — you'll get a tailored proposal first.</p>
        <button type="submit" disabled={status === "sending"} className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Apply now"}
        </button>
      </div>
    </form>
  );
}