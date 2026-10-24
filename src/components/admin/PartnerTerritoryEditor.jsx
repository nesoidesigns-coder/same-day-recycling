import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";

// Admin editor for one contractor's verified service territory: home city
// plus every additional municipality they confirmed they serve, plus the
// separately-measured capacity facts (trucks, same-day capability, availability).
// One operator covering many cities stays this single record.
export default function PartnerTerritoryEditor({ partner, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    cities: partner.service_cities || [],
    territory_type: partner.territory_type || "single_city",
    truck_capacity: partner.truck_capacity || 1,
    same_day_capable: !!partner.same_day_capable,
    availability: partner.availability || "available",
  });

  const toggleCity = (name) => setForm((f) => ({
    ...f,
    cities: f.cities.includes(name) ? f.cities.filter((c) => c !== name) : [...f.cities, name],
  }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Partner.update(partner.id, {
        service_cities: form.cities,
        territory_type: form.territory_type,
        truck_capacity: Math.max(1, Number(form.truck_capacity) || 1),
        same_day_capable: form.same_day_capable,
        availability: form.availability,
        territory_verified_date: new Date().toISOString().slice(0, 10),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOpen(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const homeCity = partner.city;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-[#102B2A]">Territory:</span>{" "}
          {homeCity}
          {(partner.service_cities || []).length > 0 && ` + ${partner.service_cities.length} more (${partner.service_cities.join(", ")})`}
          {" · "}{Math.max(1, Number(partner.truck_capacity) || 1)} truck{(Number(partner.truck_capacity) || 1) === 1 ? "" : "s"}
          {partner.same_day_capable ? " · same-day" : " · scheduled"}
        </div>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65]">
          <MapPin className="w-3.5 h-3.5" /> {open ? "Close" : "Edit territory"}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-xl bg-[#eef4f0] border border-[#187B65]/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Additional municipalities served (confirmed, not inferred)</div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-1">
            {CITIES.filter((c) => c.name !== homeCity).map((c) => (
              <label key={c.slug} className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={form.cities.includes(c.name)} onChange={() => toggleCity(c.name)} className="w-3.5 h-3.5 accent-[#187B65]" />
                {c.name}
              </label>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Territory shape
              <select value={form.territory_type} onChange={(e) => setForm({ ...form, territory_type: e.target.value })} className="input mt-1 py-2 text-sm">
                <option value="single_city">Single city</option>
                <option value="multi_city">Multi-city</option>
                <option value="metro_region">Metro region</option>
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Trucks / day
              <input type="number" min="1" max="50" value={form.truck_capacity} onChange={(e) => setForm({ ...form, truck_capacity: e.target.value })} className="input mt-1 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Availability
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="input mt-1 py-2 text-sm">
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs text-slate-600 pb-2">
              <input type="checkbox" checked={form.same_day_capable} onChange={(e) => setForm({ ...form, same_day_capable: e.target.checked })} className="w-4 h-4 accent-[#187B65]" />
              Confirmed same-day capability
            </label>
          </div>
          <button onClick={save} disabled={saving} className="mt-3 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-2 text-xs hover:bg-[#125C4E] disabled:opacity-60 inline-flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {saved ? "Saved" : "Save territory"}
          </button>
          <p className="mt-2 text-[10px] text-slate-500">Only ticked municipalities become coverage — neighbours are never auto-added.</p>
        </div>
      )}
    </div>
  );
}