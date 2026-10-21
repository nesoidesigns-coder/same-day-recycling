import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2, CheckCircle2 } from "lucide-react";

const RATE_FIELDS = [
  ["minimum_pickup", "Minimum pickup"],
  ["eighth_truck", "1/8 truck"],
  ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"],
  ["three_quarter_truck", "3/4 truck"],
  ["full_truck", "Full truck"],
];

export default function CityPricingEditor() {
  const [cityKey, setCityKey] = useState("");
  const [values, setValues] = useState(null);
  const [rowId, setRowId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setValues(null);
      setRowId(null);
      let rec = null;
      if (cityKey) {
        const { items } = await base44.entities.PricingSettings.filter({ city: cityKey }, { limit: 1 });
        rec = items[0];
      } else {
        const { items } = await base44.entities.PricingSettings.filter({ $or: [{ city: { $exists: false } }, { city: "" }] }, { limit: 1 });
        rec = items[0];
      }
      if (rec) {
        setRowId(rec.id);
        setValues(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, rec[k] ?? ""])));
      } else {
        setValues(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, ""])));
      }
    })();
  }, [cityKey]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const data = {};
    for (const [k] of RATE_FIELDS) data[k] = Number(values[k]) || 0;
    if (cityKey) data.city = cityKey;
    if (rowId) await base44.entities.PricingSettings.update(rowId, data);
    else await base44.entities.PricingSettings.create(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  if (!values) return <Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto my-8" />;

  return (
    <div className="max-w-xl">
      <label className="block mb-5">
        <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">City</span>
        <input
          value={cityKey}
          onChange={(e) => setCityKey(e.target.value)}
          className="input"
          placeholder="Default (all cities) — or type any Canadian city"
          list="city-pricing-options"
          aria-label="City for pricing"
        />
        <datalist id="city-pricing-options">
          {CITIES.map((c) => <option key={c.slug} value={c.name} />)}
        </datalist>
      </label>
      <div className="space-y-4">
        {RATE_FIELDS.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-[#102B2A]">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min="0"
                value={values[key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="input w-28 text-right"
                aria-label={label}
              />
            </div>
          </label>
        ))}
        <button onClick={save} disabled={saving} className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : `Save ${cityKey || "default"} rates`}
        </button>
      </div>
    </div>
  );
}