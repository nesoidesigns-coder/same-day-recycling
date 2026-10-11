import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, Lock } from "lucide-react";

const FIELDS = [
  ["minimum_pickup", "Minimum pickup"],
  ["eighth_truck", "1/8 truck"],
  ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"],
  ["three_quarter_truck", "3/4 truck"],
  ["full_truck", "Full truck"],
];

export default function AdminPricing() {
  const [role, setRole] = useState("loading");
  const [row, setRow] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setRole(me?.role || "user");
        const { items } = await base44.entities.PricingSettings.filter({}, { limit: 1 });
        if (items[0]) {
          setRow(items[0]);
          setValues({
            minimum_pickup: items[0].minimum_pickup ?? 129,
            eighth_truck: items[0].eighth_truck ?? 189,
            quarter_truck: items[0].quarter_truck ?? 269,
            half_truck: items[0].half_truck ?? 419,
            three_quarter_truck: items[0].three_quarter_truck ?? 549,
            full_truck: items[0].full_truck ?? 649,
          });
        }
      } catch {
        setRole("none");
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const data = {};
      for (const [key] of FIELDS) data[key] = Number(values[key]) || 0;
      if (row) await base44.entities.PricingSettings.update(row.id, data);
      else await base44.entities.PricingSettings.create(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (role === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Lock className="w-10 h-10 text-[#1d9e56]" />
        <h1 className="text-2xl font-bold text-[#0c3b24]">Admins only</h1>
        <p className="text-slate-600">You need an admin account to edit pricing.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-2">Admin</div>
          <h1 className="text-3xl font-bold text-[#0c3b24]">Pricing settings</h1>
          <p className="text-slate-600 mt-2 text-sm">Placeholder rates — used by the instant quote calculator and the AI chat. Final price is always confirmed on arrival.</p>
          <Link to="/admin/jobs" className="inline-block mt-3 text-sm font-semibold text-[#1d9e56] hover:underline">Dispatch, partners &amp; payouts →</Link>
        </div>
        {!row && !Object.keys(values).length ? (
          <p className="text-slate-600">Loading settings…</p>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 space-y-4">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-[#0c3b24]">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="input w-28 text-right"
                  />
                </div>
              </label>
            ))}
            <button onClick={save} disabled={saving} className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : null}
              {saving ? "Saving…" : saved ? "Saved" : "Save prices"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}