import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TradeLeadForm({ title, subtitle, fields, submitLabel, buildPayload }) {
  const [form, setForm] = useState({});
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const missing = fields.filter((f) => f.required && !String(form[f.name] || "").trim());
    if (missing.length) {
      setError("Please fill in all required fields.");
      return;
    }
    setStatus("sending");
    try {
      await base44.functions.invoke("createBooking", buildPayload(form));
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError("Something went wrong. Please call or text (604) 849-1745.");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#1d9e56] mx-auto" />
        <h3 className="mt-4 text-2xl font-bold text-[#0c3b24]">Request received</h3>
        <p className="mt-2 text-slate-600">We'll confirm your slot shortly. Questions? Call or text (604) 849-1745.</p>
      </div>
    );
  }

  return (
    <div id="book" className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <h3 className="text-2xl font-bold text-[#0c3b24]">{title}</h3>
      {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-semibold text-[#0c3b24] mb-1.5">
              {f.label}{f.required && <span className="text-[#1d9e56]"> *</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea className="input min-h-24" placeholder={f.placeholder} value={form[f.name] || ""} onChange={set(f.name)} />
            ) : f.type === "select" ? (
              <select className="input" value={form[f.name] || ""} onChange={set(f.name)}>
                <option value="">{f.placeholder || "Select…"}</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input className="input" type={f.type || "text"} placeholder={f.placeholder} value={form[f.name] || ""} onChange={set(f.name)} />
            )}
          </div>
        ))}
        <div className="sm:col-span-2">
          {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={status === "sending"} className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "sending" ? "Sending…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}