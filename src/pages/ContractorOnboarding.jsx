import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  Truck,
  FileUp,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";

const EQUIPMENT_OPTIONS = [
  "Pickup truck",
  "Pickup + trailer",
  "1-ton + dump trailer",
  "Full dump truck",
  "Bin / container rental",
  "Pallet jack / lifting gear",
];

const DOC_FIELDS = [
  { key: "business_license", uriField: "business_license_uri", label: "Business licence", hint: "Provincial registration or municipal licence", required: true },
  { key: "insurance", uriField: "insurance_uri", label: "Liability insurance", hint: "Certificate of insurance", required: true },
  { key: "wcb", uriField: "wcb_uri", label: "WCB / workers' comp", hint: "Clearance letter or coverage certificate", required: true },
  { key: "vehicle_registration", uriField: "vehicle_registration_uri", label: "Vehicle registration", hint: "For the truck(s) doing pickups", required: false },
  { key: "drivers_license", uriField: "drivers_license_uri", label: "Driver's licence", hint: "Lead driver's valid licence", required: false },
];

export default function ContractorOnboarding() {
  const [form, setForm] = useState({
    company: "",
    owner_name: "",
    email: "",
    phone: "",
    city: "",
    fleet_description: "",
    equipment: [],
  });
  const [docs, setDocs] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const toggleEquipment = (item) =>
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item) ? f.equipment.filter((x) => x !== item) : [...f.equipment, item],
    }));

  const pickDoc = (key) => (e) => {
    const file = e.target.files?.[0];
    if (file) setDocs((d) => ({ ...d, [key]: file }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.company.trim() || !form.owner_name.trim() || !form.email.trim() || !form.city.trim()) {
      setError("Company, owner name, email and city are required.");
      return;
    }
    const missing = DOC_FIELDS.filter((d) => d.required && !docs[d.key]);
    if (missing.length) {
      setError(`Please upload: ${missing.map((d) => d.label).join(", ")}.`);
      return;
    }
    setStatus("submitting");
    try {
      const payload = {
        action: "submit",
        company: form.company.trim(),
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        fleet_description: form.fleet_description.trim(),
        equipment: form.equipment,
      };
      for (const d of DOC_FIELDS) {
        if (docs[d.key]) {
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: docs[d.key] });
          payload[d.uriField] = file_uri;
        }
      }
      const res = await base44.functions.invoke("contractorOnboarding", payload);
      setResult(res.data);
      setStatus("done");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Something went wrong. Please call or text (604) 849-1745.");
      setStatus("idle");
    }
  };

  if (status === "done" && result) {
    const verdict = result.verdict || "needs_attention";
    const verdictMeta = {
      pass: { icon: ShieldCheck, color: "text-[#187B65]", label: "Documents look good" },
      needs_attention: { icon: AlertTriangle, color: "text-amber-400", label: "Needs a quick look" },
      fail: { icon: XCircle, color: "text-red-400", label: "Issues found" },
    }[verdict];
    const VerdictIcon = verdictMeta.icon;
    return (
      <div className="min-h-screen bg-[#051511] px-4 py-12 text-emerald-50">
        <div className="max-w-xl mx-auto rounded-3xl border border-[#187B65]/30 bg-[#102B2A]/50 backdrop-blur-sm p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">Application submitted</h1>
          <p className="mt-2 text-sm text-emerald-100/60">
            Thanks, {form.owner_name} — your profile and documents are in. Our team completes final approval and emails you at {form.email}.
          </p>
          <div className="mt-6 rounded-2xl border border-[#187B65]/25 bg-[#051511]/60 p-5 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <VerdictIcon className={`w-5 h-5 ${verdictMeta.color}`} />
              AI document check: {verdictMeta.label}
            </div>
            {result.summary && <p className="mt-2 text-sm text-emerald-100/70">{result.summary}</p>}
            {result.issues?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {result.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-100/60">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-[#187B65] text-[#032015] font-bold px-6 py-3 text-sm hover:bg-[#1FA184] transition-colors">
            Back to homepage <ArrowRight className="w-4 h-4 inline ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051511] text-emerald-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <span className="inline-flex w-14 h-14 rounded-2xl border border-[#187B65]/40 bg-[#102B2A]/60 items-center justify-center mb-4">
            <Truck className="w-7 h-7 text-[#187B65]" />
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join the national contractor network</h1>
          <p className="mt-2 text-sm text-emerald-100/60">
            Create your profile, upload your verification documents, and our AI checks them instantly — then our team approves you and jobs start flowing to your dashboard.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-8">
          <section className="rounded-3xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-6 md:p-8 space-y-5">
            <h2 className="text-lg font-bold text-white">1. Your profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ob-company" className="block text-sm font-semibold text-white mb-1.5">Company name <span className="text-[#187B65]">*</span></label>
                <input id="ob-company" className="input !bg-white" value={form.company} onChange={set("company")} placeholder="Dan's Hauling Ltd." />
              </div>
              <div>
                <label htmlFor="ob-owner" className="block text-sm font-semibold text-white mb-1.5">Owner / contact name <span className="text-[#187B65]">*</span></label>
                <input id="ob-owner" className="input !bg-white" value={form.owner_name} onChange={set("owner_name")} placeholder="Dan Peters" />
              </div>
              <div>
                <label htmlFor="ob-email" className="block text-sm font-semibold text-white mb-1.5">Email <span className="text-[#187B65]">*</span></label>
                <input id="ob-email" type="email" className="input !bg-white" value={form.email} onChange={set("email")} placeholder="dan@danshauling.ca" />
              </div>
              <div>
                <label htmlFor="ob-phone" className="block text-sm font-semibold text-white mb-1.5">Phone</label>
                <input id="ob-phone" type="tel" className="input !bg-white" value={form.phone} onChange={set("phone")} placeholder="(416) 555-0123" />
              </div>
            </div>
            <div>
              <label htmlFor="ob-city" className="block text-sm font-semibold text-white mb-1.5">Service city / territory <span className="text-[#187B65]">*</span></label>
              <input id="ob-city" className="input !bg-white" value={form.city} onChange={set("city")} placeholder="Calgary" />
            </div>
            <div>
              <div className="block text-sm font-semibold text-white mb-2">Equipment list</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2.5 rounded-xl border border-[#187B65]/25 bg-[#051511]/60 px-4 py-3 text-sm text-emerald-100/80 cursor-pointer hover:border-[#187B65]/60 transition-colors">
                    <input type="checkbox" checked={form.equipment.includes(item)} onChange={() => toggleEquipment(item)} className="w-4 h-4 accent-[#187B65]" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="ob-fleet" className="block text-sm font-semibold text-white mb-1.5">Anything else about your operation?</label>
              <textarea id="ob-fleet" rows={3} className="input !bg-white" value={form.fleet_description} onChange={set("fleet_description")} placeholder="Crew size, service radius, dump agreements…" />
            </div>
          </section>

          <section className="rounded-3xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white">2. Verification documents</h2>
            <p className="text-sm text-emerald-100/60">PDF or photo. Uploads are stored privately — only our admin team and our AI verifier see them.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {DOC_FIELDS.map((d) => (
                <label
                  key={d.key}
                  className={`flex flex-col gap-1 rounded-2xl border px-4 py-4 cursor-pointer transition-colors ${
                    docs[d.key] ? "border-[#187B65] bg-[#187B65]/10" : "border-[#187B65]/25 bg-[#051511]/60 hover:border-[#187B65]/60"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <FileUp className={`w-4 h-4 ${docs[d.key] ? "text-[#187B65]" : "text-emerald-100/40"}`} />
                    {d.label}
                    {d.required && <span className="text-[#187B65]">*</span>}
                  </span>
                  <span className="text-xs text-emerald-100/50">{docs[d.key]?.name || d.hint}</span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={pickDoc(d.key)} />
                </label>
              ))}
            </div>
          </section>

          {error && <p className="text-sm font-medium text-red-400" role="alert">{error}</p>}

          <button type="submit" disabled={status === "submitting"} className="w-full rounded-full bg-[#187B65] text-[#032015] font-bold px-7 py-4 hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {status === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "submitting" ? "Submitting and verifying…" : "Submit application"}
          </button>
          <p className="text-xs text-emerald-100/40 text-center">
            Our AI pre-checks your documents instantly; final approval is done by our team. Questions? Call (604) 849-1745.
          </p>
        </form>
      </div>
    </div>
  );
}