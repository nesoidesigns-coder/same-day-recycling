import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cityCredentialsFor } from "@/lib/cityTrust";
import { ShieldCheck, Leaf, Star, BadgeCheck } from "lucide-react";

const BASE_CREDENTIALS = [
  { icon: ShieldCheck, label: "Licensed, insured & WCB-covered crews" },
  { icon: Leaf, label: "Recycling & donation first — never straight to landfill" },
  { icon: BadgeCheck, label: "Upfront pricing, approved before we lift a thing" },
];

export default function CityTrust({ city }) {
  const [stats, setStats] = useState(null);
  const credentials = cityCredentialsFor(city.slug);

  useEffect(() => {
    let active = true;
    base44.entities.Review
      .aggregate({ query: { city: city.name, approved: true }, avg: "rating" })
      .then((res) => {
        if (active) setStats(res?.rows?.[0] || { count: 0 });
      })
      .catch(() => active && setStats({ count: 0 }));
    return () => {
      active = false;
    };
  }, [city.name]);

  if (!credentials) return null;

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
            <ShieldCheck className="w-4 h-4 text-[#1d9e56]" />
            Trusted in {city.name}
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            Why {city.name} trusts Same Day Recycling
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Local track record, local facilities, and a promise we keep on every load.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {credentials.map((c) => (
            <div key={c} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-[#0c3b24] leading-snug">{c}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats && stats.count > 0 && (
            <div className="rounded-2xl bg-[#0c3b24] p-5 flex flex-col justify-center">
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= Math.round(stats.avg_rating || 5) ? "text-[#1d9e56] fill-[#1d9e56]" : "text-[#1d9e56]/30"}`} />
                ))}
              </div>
              <span className="text-white font-bold">
                {Number(stats.avg_rating || 5).toFixed(1)}/5 · {stats.count} verified {city.name} review{stats.count === 1 ? "" : "s"}
              </span>
            </div>
          )}
          {BASE_CREDENTIALS.map(({ icon: Icon, label }) => (
            <div key={label} className={`rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 flex items-start gap-3 ${stats && stats.count > 0 ? "" : "lg:col-span-2"}`}>
              <Icon className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-[#0c3b24] leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}