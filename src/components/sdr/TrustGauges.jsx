import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Star, Clock, Recycle, ClipboardCheck, Info } from "lucide-react";

const NEUTRAL = [
  { key: "response", icon: Clock, name: "Average response time", def: "Time from a quote request to our first reply, averaged over the trailing 30 days." },
  { key: "diversion", icon: Recycle, name: "Recycling & reuse diversion", def: "Share of collected material diverted from landfill, reported once disposal records are compiled." },
  { key: "completion", icon: ClipboardCheck, name: "Quote completion rate", def: "Share of quote requests that finish the form, over the trailing 30 days." },
];

function Ring({ pct, neutral }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="w-20 h-20" role="img" aria-hidden="true">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      {!neutral && (
        <circle
          cx="42" cy="42" r={r} fill="none" stroke="#187B65" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 42 42)"
        />
      )}
      <text x="42" y="40" textAnchor="middle" className="fill-[#102B2A] font-bold" style={{ fontSize: 15 }}>
        {neutral ? "—" : `${Math.round(pct)}%`}
      </text>
      <text x="42" y="55" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>
        {neutral ? "pending data" : "verified"}
      </text>
    </svg>
  );
}

export default function TrustGauges() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [total, verified, reviews] = await Promise.all([
          base44.entities.Provider.count({}),
          base44.entities.Provider.count({ verification: "verified" }),
          base44.entities.Review.filter({ approved: true }),
        ]);
        const items = reviews.items || [];
        const ratings = items.map((r) => r.rating).filter((r) => typeof r === "number");
        setData({
          total,
          verified,
          satisfaction: ratings.length
            ? { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length }
            : null,
          updated: new Date().toISOString().slice(0, 10),
        });
      } catch {
        setData(null);
      }
    })();
  }, []);

  return (
    <section aria-label="Trust metrics" className="bg-[#f4f7f5] border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A]">How we measure trust</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Every metric below states what it counts, its reporting period, and where the number comes from. Unavailable data stays blank.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-white border border-slate-100 p-6 flex flex-col items-center text-center">
            <Ring pct={data ? (data.total ? (data.verified / data.total) * 100 : 0) : 0} neutral={!data || !data.total} />
            <div className="mt-3 flex items-center gap-1.5 font-bold text-[#102B2A]"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Verified listings</div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {data && data.total
                ? `${data.verified} of ${data.total} directory listings confirmed against an official source.`
                : "Directory listings confirmed against official sources."}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">Source: recycling directory database · Updated {data?.updated || "—"}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 flex items-center justify-center">
              <div className="text-center">
                <Star className="w-8 h-8 text-[#187B65] fill-[#187B65] mx-auto" />
                <div className="mt-1 text-xl font-bold text-[#102B2A]">{data?.satisfaction ? data.satisfaction.avg.toFixed(1) : "—"}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 font-bold text-[#102B2A]"><Star className="w-4 h-4 text-[#187B65]" /> Customer satisfaction</div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {data?.satisfaction
                ? `Average of ${data.satisfaction.count} approved customer review${data.satisfaction.count === 1 ? "" : "s"} — all-time.`
                : "Average of approved customer reviews, all-time."}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">Source: approved reviews · Updated {data?.updated || "—"}</p>
          </div>
          {NEUTRAL.map((g) => (
            <div key={g.key} className="rounded-2xl bg-white border border-slate-100 p-6 flex flex-col items-center text-center">
              <Ring pct={0} neutral />
              <div className="mt-3 flex items-center gap-1.5 font-bold text-[#102B2A]"><g.icon className="w-4 h-4 text-slate-400" /> {g.name}</div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{g.def}</p>
              <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1"><Info className="w-3 h-3" /> Not yet tracked</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}