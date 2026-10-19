import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Recycle } from "lucide-react";

const TIER_LABELS = [
  { key: "minimum_pickup", label: "Minimum pickup", detail: "1–2 items or a small pile" },
  { key: "eighth_truck", label: "1/8 truck", detail: "A loveseat, a few boxes" },
  { key: "quarter_truck", label: "1/4 truck", detail: "A sofa set or a room's worth" },
  { key: "half_truck", label: "1/2 truck", detail: "A full bedroom + boxes" },
  { key: "three_quarter_truck", label: "3/4 truck", detail: "A packed garage" },
  { key: "full_truck", label: "Full truck", detail: "Garage to the roof" },
];

const FALLBACK = { minimum_pickup: 149, eighth_truck: 189, quarter_truck: 299, half_truck: 419, three_quarter_truck: 549, full_truck: 649 };

export default function CityPricing({ city }) {
  const [prices, setPrices] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("cityPricing", { city })
      .then((res) => {
        if (active && res?.data?.prices) setPrices(res.data.prices);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [city]);

  return (
    <section className="bg-[#f4f7f5] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24]">
          Junk removal prices in {city}
        </h2>
        <p className="mt-3 text-slate-600">
          You pay by truck space, not by the hour — the price we quote is the price you pay. Book before noon for same-day pickup.
        </p>
        <div className="mt-8 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {TIER_LABELS.map((t, i) => (
            <div key={t.key} className={`flex items-center justify-between gap-4 px-5 md:px-8 py-4 ${i > 0 ? "border-t border-slate-100" : ""}`}>
              <div>
                <div className="font-bold text-[#0c3b24]">{t.label}</div>
                <div className="text-sm text-slate-500">{t.detail}</div>
              </div>
              <div className="text-lg md:text-xl font-bold text-[#1d9e56] whitespace-nowrap">
                ${loaded ? prices[t.key] : "…"}
              </div>
            </div>
          ))}
          <div className="border-t border-slate-100 bg-[#f4f7f5] px-5 md:px-8 py-4 flex items-center gap-2 text-sm text-slate-600">
            <Recycle className="w-4 h-4 text-[#1d9e56] shrink-0" />
            Recycling and donation are always included — you never pay extra for eco disposal.
          </div>
        </div>
      </div>
    </section>
  );
}