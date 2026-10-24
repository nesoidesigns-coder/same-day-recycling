import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, Send, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS, normalizePostal, provinceFromFsa, territoryNeeded, provinceName, SERVICE_TYPES } from "@/lib/geo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import PickupCoverageNotice from "@/components/sdr/PickupCoverageNotice";
import { CITIES } from "@/lib/cities";

// Nationwide service-request form. Any municipality and any valid postal
// code can submit — nothing is represented as confirmed service until a
// provider accepts. Verified territories show a direct-booking shortcut.
// Accepts ?city= and ?service= params so other forms can hand off inquiries.
export default function NationalRequestForm() {
  const params = new URLSearchParams(window.location.search);
  const prefillCity = (params.get("city") || "").slice(0, 120);
  const prefillProvince = REGIONS.some((r) => r.code === (params.get("province") || "").toUpperCase()) ? params.get("province").toUpperCase() : "";
  const prefillService = SERVICE_TYPES.some((s) => s.value === params.get("service")) ? params.get("service") : "junk_removal";
  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: prefillCity, province_code: prefillProvince,
    postal_code: "", service_type: prefillService, items_description: "",
    preferred_date: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const liveCoverage = useCoverageStatus();
  const coverage = liveCoverage.statusFor(form.city);

  const fsa = normalizePostal(form.postal_code);
  const needTerritory = territoryNeeded(fsa);

  const onPostal = (e) => {
    const code = e.target.value;
    const f = normalizePostal(code);
    const prov = provinceFromFsa(f);
    setForm((prev) => ({
      ...prev,
      postal_code: code,
      province_code: prov || (territoryNeeded(f) ? "" : prev.province_code),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("nationalRequest", {
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city.trim(),
        province_code: form.province_code,
        postal_code: fsa,
        service_type: form.service_type,
        items_description: form.items_description,
        preferred_date: form.preferred_date,
        notes: form.notes,
      });
      base44.analytics.track({ eventName: "national_request_submitted", properties: { province: res?.data?.province_code || "", service: form.service_type } });
      setResult(res?.data || null);
    } catch {
      setError("Something went wrong. Please try again or call (604) 849-1745.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center">
        <CheckCircle2 className="w-14 h-14 text-[#187B65] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#102B2A]">Request received</h3>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">
          {result.message || "Your request is in the provider matching queue."}
        </p>
        {result.reference_code && (
          <div className="mt-4 inline-block rounded-full bg-[#f4f7f5] border border-slate-200 px-5 py-2 font-mono font-bold text-[#102B2A]">
            Reference: {result.reference_code}
          </div>
        )}
        <div className="mt-6 text-left max-w-md mx-auto rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5">
          <div className="text-sm font-bold text-[#102B2A] mb-2">What happens next</div>
          <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>We match your request with a verified local provider.</li>
            <li>The provider confirms availability and pricing.</li>
            <li>You receive a confirmed quote and service appointment.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">Nothing is charged and no pickup is scheduled until a provider accepts your job.</p>
        </div>
        <Link to={`/request-status?reference=${encodeURIComponent(result.reference_code || "")}`} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand-emerald px-5 text-sm font-bold text-market-ink">Track my request</Link>
        <button onClick={() => { setResult(null); setForm({ name: "", phone: "", email: "", city: "", province_code: "", postal_code: "", service_type: "junk_removal", items_description: "", preferred_date: "", notes: "" }); }} className="mt-6 text-[#187B65] font-semibold hover:underline">
          Submit another request
        </button>
      </div>
    );
  }

  const notLive = coverage !== "same_day";

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#102B2A]">Request service</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">Requests accepted in every Canadian province and territory. Pickup requires contractor acceptance.</p>

      <PickupCoverageNotice city={form.city} />

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" required>
            <input value={form.name} onChange={update("name")} required className="input" placeholder="Your name" />
          </Field>
          <Field label="Phone number" required>
            <input value={form.phone} onChange={update("phone")} required type="tel" className="input" placeholder="(000) 000-0000" />
          </Field>
        </div>
        <Field label="Email">
          <input value={form.email} onChange={update("email")} type="email" className="input" placeholder="you@email.com" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City / municipality" required>
            <input value={form.city} onChange={update("city")} required list="sdr-city-list" className="input" placeholder="Any city in Canada" />
            <datalist id="sdr-city-list">
              {CITIES.map((c) => <option key={c.slug} value={c.name} />)}
            </datalist>
          </Field>
          <Field label="Postal code">
            <input value={form.postal_code} onChange={onPostal} className="input" placeholder="e.g. M5V 2T6" />
          </Field>
        </div>
        <Field label="Province / territory">
          {needTerritory ? (
            <div>
              <select value={form.province_code} onChange={update("province_code")} required className="input">
                <option value="" disabled>X postal codes cover two territories — choose yours</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
              </select>
            </div>
          ) : form.province_code ? (
            <div className="input bg-[#f4f7f5] text-slate-600">{provinceName(form.province_code)} <span className="text-xs text-slate-400">(from your postal code)</span></div>
          ) : (
            <select value={form.province_code} onChange={update("province_code")} className="input">
              <option value="">Select province or territory</option>
              {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Service type" required>
          <select value={form.service_type} onChange={update("service_type")} required className="input">
            {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="What needs to be picked up?" required>
          <textarea value={form.items_description} onChange={update("items_description")} required rows={3} className="input resize-none" placeholder="e.g. one sofa, a washer-dryer, boxes of scrap metal" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Preferred date">
            <input value={form.preferred_date} onChange={update("preferred_date")} type="date" className="input" />
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} onChange={update("notes")} className="input" placeholder="Gate codes, staging spot, etc." />
          </Field>
        </div>
        {notLive && (
          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            Provider Confirmation Required: your request is matched with a local provider before any pickup is scheduled. No payment is taken for unconfirmed services.
          </p>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-full bg-brand-emerald text-market-ink font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : <><Send className="w-5 h-5" /> Submit service request</>}
      </button>
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">{label}{required && <span className="text-[#187B65]"> *</span>}</span>
      {children}
    </label>
  );
}