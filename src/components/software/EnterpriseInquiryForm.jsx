import { useState } from "react";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

const empty = { company: "", contact_name: "", email: "", phone: "", fleet_size: "", message: "" };

export default function EnterpriseInquiryForm() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await base44.entities.SoftwareInquiry.create({
        company: form.company.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        fleet_size: Number(form.fleet_size) || 1,
        message: form.message.trim().slice(0, 1000),
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not send your inquiry.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-6 rounded-2xl border border-[#187B65]/40 bg-[#187B65]/10 p-6 text-center">
        <p className="font-bold text-[#54D9AE]">Thanks — your inquiry is in.</p>
        <p className="text-sm text-emerald-100/60 mt-1">Our team will reach out to scope your Network license.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-3 text-left">
      <input className="input" placeholder="Company name" value={form.company} onChange={set("company")} required />
      <input className="input" placeholder="Contact name" value={form.contact_name} onChange={set("contact_name")} required />
      <input className="input" type="email" placeholder="Work email" value={form.email} onChange={set("email")} required />
      <input className="input" placeholder="Phone" value={form.phone} onChange={set("phone")} />
      <input className="input" type="number" min="1" placeholder="Vehicles in fleet" value={form.fleet_size} onChange={set("fleet_size")} />
      <textarea
        className="input sm:col-span-2 min-h-[96px] resize-y"
        placeholder="Territories served, current tools, what you need"
        value={form.message}
        onChange={set("message")}
      />
      {error && <p className="sm:col-span-2 text-sm text-red-400 font-semibold">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="sm:col-span-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}