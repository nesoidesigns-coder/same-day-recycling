import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2, MapPin, Truck, FileText, DollarSign, Pencil, CheckCircle2, X } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-100/40";

// Partner territory card: their whole confirmed service area (home city +
// confirmed municipalities), the capacity facts, and the editor where the
// contractor declares which municipalities they ACTUALLY serve. Coverage is
// explicit — neighbouring cities are never added automatically.
export default function TerritoryCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("partnerPortal", { action: "territory" });
      if (res.data?.error) setError(res.data.error);
      else setData(res.data);
    } catch (e) {
      setError(e?.message || "Could not load territory data");
    }
  };
  useEffect(() => { load(); }, []);

  const startEdit = () => {
    setForm({
      service_cities: [...(data.service_cities || [])],
      territory_type: data.territory_type || "single_city",
      truck_capacity: data.truck_capacity || 1,
      same_day_capable: !!data.same_day_capable,
      availability: data.availability || "available",
    });
    setEditing(true);
  };

  const toggleCity = (name) => setForm((f) => ({
    ...f,
    service_cities: f.service_cities.includes(name) ? f.service_cities.filter((c) => c !== name) : [...f.service_cities, name],
  }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("partnerPortal", { action: "territory_save", ...form, truck_capacity: Number(form.truck_capacity) || 1 });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await load();
    } catch (e) {
      setError(e?.message || "Could not save your service area");
    } finally {
      setSaving(false);
    }
  };

  if (error && !data) return null;

  if (!data) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#187B65] animate-spin" />
      </div>
    );
  }

  const homeCity = data.city;
  const cityOptions = CITIES.filter((c) => c.name !== homeCity);
  const extra = form?.service_cities.filter((c) => !cityOptions.some((o) => o.name === c)) || [];

  const stats = [
    { icon: Truck, value: data.bookings, sub: "Bookings", glow: false },
    { icon: FileText, value: data.quotes, sub: "Quotes", glow: false },
    { icon: DollarSign, value: money(data.estimated_revenue), sub: "Estimated revenue", glow: true },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm">
      <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#187B65]/50" />
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#187B65]/20">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#187B65]" />
          <span className="font-bold text-white tracking-tight">Territory: {data.cities?.length > 1 ? `${data.cities.length} municipalities` : (homeCity || "—")}</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[#187B65] text-[10px] font-bold uppercase tracking-[0.25em]">Saved</span>}
          {!editing && (
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-full border border-[#187B65]/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65] hover:bg-[#187B65]/10">
              <Pencil className="w-3 h-3" /> Service area
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-[#187B65]/20 text-xs text-emerald-100/70">
        <span className={label + " block mb-1.5"}>Confirmed service area</span>
        <div className="flex flex-wrap gap-1.5">
          {(data.cities || []).map((c) => (
            <span key={c} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${c === homeCity ? "bg-[#187B65]/20 text-[#187B65]" : "bg-white/10 text-emerald-100/80"}`}>
              {c === homeCity ? `${c} (home)` : c}
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-emerald-100/50">
          <span>Trucks: <strong className="text-white tabular-nums">{data.truck_capacity}</strong></span>
          <span>Same-day: <strong className={data.same_day_capable ? "text-[#187B65]" : "text-amber-300"}>{data.same_day_capable ? "confirmed" : "not confirmed"}</strong></span>
          <span>Availability: <strong className="text-white">{data.availability || "available"}</strong></span>
        </div>
      </div>

      {editing && form && (
        <div className="px-6 py-4 border-b border-[#187B65]/20 bg-[#0a2b1e]/40">
          <span className={label + " block mb-2"}>Municipalities you actually serve (beyond {homeCity})</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-1">
            {cityOptions.map((c) => (
              <label key={c.slug} className="flex items-center gap-1.5 text-xs text-emerald-100/70">
                <input type="checkbox" checked={form.service_cities.includes(c.name)} onChange={() => toggleCity(c.name)} className="w-3.5 h-3.5 accent-[#187B65]" />
                {c.name}
              </label>
            ))}
          </div>
          {extra.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {extra.map((c) => (
                <button key={c} onClick={() => toggleCity(c)} className="inline-flex items-center gap-1 rounded-full bg-white/10 text-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold hover:text-white">
                  {c} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label className={label}>
              Territory shape
              <select value={form.territory_type} onChange={(e) => setForm({ ...form, territory_type: e.target.value })} className="mt-1 w-full rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white">
                <option value="single_city">Single city</option>
                <option value="multi_city">Multi-city</option>
                <option value="metro_region">Metro region</option>
              </select>
            </label>
            <label className={label}>
              Trucks / day
              <input type="number" min="1" max="50" value={form.truck_capacity} onChange={(e) => setForm({ ...form, truck_capacity: e.target.value })} className="mt-1 w-full rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white" />
            </label>
            <label className={label}>
              Availability
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-1 w-full rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white">
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-emerald-100/70">
            <input type="checkbox" checked={form.same_day_capable} onChange={(e) => setForm({ ...form, same_day_capable: e.target.checked })} className="w-4 h-4 accent-[#187B65]" />
            I confirm same-day fulfillment capability in this service area
          </label>
          <div className="mt-3 flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-5 py-2 text-xs disabled:opacity-60 inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save service area
            </button>
            <button onClick={() => setEditing(false)} className="rounded-full border border-[#187B65]/40 px-4 py-2 text-xs font-bold text-emerald-100/70 hover:text-white">Cancel</button>
          </div>
          <p className="mt-2 text-[10px] text-emerald-100/40">Only municipalities you tick (or add) count as coverage — nearby cities are never assumed.</p>
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-[#187B65]/15">
        {stats.map((s) => (
          <div key={s.sub} className="p-6 text-center">
            <s.icon className="w-5 h-5 mx-auto text-[#187B65]" />
            <div className={`text-2xl font-bold mt-2 tabular-nums ${s.glow ? "text-[#187B65] holo-glow-text" : "text-white"}`}>{s.value}</div>
            <div className={`${label} mt-1`}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}