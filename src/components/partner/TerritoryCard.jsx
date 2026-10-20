import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Truck, FileText, DollarSign } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-100/40";

export default function TerritoryCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("partnerPortal", { action: "territory" });
        if (res.data?.error) setError(res.data.error);
        else setData(res.data);
      } catch (e) {
        setError(e?.message || "Could not load territory data");
      }
    })();
  }, []);

  if (error) return null;

  if (!data) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 bg-[#0c3b24]/50 backdrop-blur-sm p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  const stats = [
    { icon: Truck, value: data.bookings, sub: "Bookings", glow: false },
    { icon: FileText, value: data.quotes, sub: "Quotes", glow: false },
    { icon: DollarSign, value: money(data.estimated_revenue), sub: "Estimated revenue", glow: true },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 bg-[#0c3b24]/50 backdrop-blur-sm">
      <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#1d9e56]/50" />
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#1d9e56]/20">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1d9e56]" />
          <span className="font-bold text-white tracking-tight">Territory: {data.city || "—"}</span>
        </div>
        <span className="text-[#1d9e56] text-[10px] font-bold uppercase tracking-[0.25em] holo-flicker">Same Day Recycling Network</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#1d9e56]/15">
        {stats.map((s) => (
          <div key={s.sub} className="p-6 text-center">
            <s.icon className="w-5 h-5 mx-auto text-[#1d9e56]" />
            <div className={`text-2xl font-bold mt-2 tabular-nums ${s.glow ? "text-[#1d9e56] holo-glow-text" : "text-white"}`}>{s.value}</div>
            <div className={`${label} mt-1`}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}