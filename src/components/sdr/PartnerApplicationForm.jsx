import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TRUCK_SIZES = ["Pickup truck", "Pickup + trailer", "1-ton + dump trailer", "Full dump truck"];
const CITY_OPTIONS = [
  // Lower Mainland first — where the network actually operates today.
  "Vancouver",
  "North Vancouver",
  "Burnaby",
  "Surrey",
  "Richmond",
  "Coquitlam",
  "Victoria",
  "Kelowna",
  "Kamloops",
  "Edmonton",
  "Calgary",
  "Halifax",
  "Quebec City",
  "Toronto",
  "Mississauga",
  "Hamilton",
  "Winnipeg",
  "Ottawa",

  "Other city (tell us below)",
];

export default function PartnerApplicationForm() {
  const [form, setForm] = useState(() => {
    const cityParam = new URLSearchParams(window.location.search).get("city") || "";
    return { city: cityParam };
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const required = ["name", "company", "city", "truck_size", "insured", "phone", "email"];
    const missing = required.filter((r) => !String(form[r] || "").trim());
    if (missing.length) {
      setError("Please fill in all required fields.");
      return;
    }
    setStatus("sending");
    try {
      // Contractor inquiries belong to the contractor CRM, not the customer
      // quote pipeline. Saving them as QuoteLead hid every partner application
      // from the contractor funnel and mixed operators into customer leads.
      await base44.entities.ContractorApplication.create({
        company: form.company,
        owner_name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        fleet_description: form.truck_size,
        equipment: [form.truck_size].filter(Boolean),
        description: `Insured: ${form.insured}. ${form.message || "No additional notes."}`,
        status: "new",
      });
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please call or text (604) 849-1745.");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto" />
        <h3 className="mt-4 text-2xl font-bold text-[#102B2A]">Application received</h3>
        <p className="mt-2 text-slate-600">Territories open in order of application — we'll call you within one business day. Questions? (604) 849-1745.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Your name <span className="text-[#187B65]">*</span></label>
          <input className="input" value={form.name || ""} onChange={set("name")} placeholder="Dan Hauler" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Company name <span className="text-[#187B65]">*</span></label>
          <input className="input" value={form.company || ""} onChange={set("company")} placeholder="Dan's Hauling Ltd." />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">City / territory requested <span className="text-[#187B65]">*</span></label>
          <input className="input" value={form.city || ""} onChange={set("city")} placeholder="Edmonton" list="partner-cities" />
          <datalist id="partner-cities">
            {CITY_OPTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Truck size <span className="text-[#187B65]">*</span></label>
          <select className="input" value={form.truck_size || ""} onChange={set("truck_size")}>
            <option value="">Select truck size…</option>
            {TRUCK_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Insured? <span className="text-[#187B65]">*</span></label>
          <select className="input" value={form.insured || ""} onChange={set("insured")}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Phone <span className="text-[#187B65]">*</span></label>
          <input className="input" type="tel" value={form.phone || ""} onChange={set("phone")} placeholder="(604) 555-1234" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Email <span className="text-[#187B65]">*</span></label>
          <input className="input" type="email" value={form.email || ""} onChange={set("email")} placeholder="you@company.ca" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-[#102B2A] mb-1.5">Anything we should know?</label>
          <textarea className="input min-h-24" value={form.message || ""} onChange={set("message")} placeholder="Trucks available, service area, experience…" />
        </div>
        <div className="sm:col-span-2">
          {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={status === "sending"} className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "sending" ? "Sending…" : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}