import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Truck, FileText, DollarSign } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

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
      <div className="rounded-3xl bg-white border border-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden">
      <div className="bg-[#0c3b24] px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1d9e56]" />
          <span className="font-bold text-white">Territory: {data.city || "—"}</span>
        </div>
        <span className="text-[#1d9e56] text-xs font-bold uppercase tracking-wide">Same Day Recycling Network</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="p-6 text-center">
          <Truck className="w-5 h-5 mx-auto text-[#1d9e56]" />
          <div className="text-2xl font-bold text-[#0c3b24] mt-1">{data.bookings}</div>
          <div className="text-xs text-slate-500 mt-1">Bookings</div>
        </div>
        <div className="p-6 text-center">
          <FileText className="w-5 h-5 mx-auto text-[#1d9e56]" />
          <div className="text-2xl font-bold text-[#0c3b24] mt-1">{data.quotes}</div>
          <div className="text-xs text-slate-500 mt-1">Quotes</div>
        </div>
        <div className="p-6 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-[#1d9e56]" />
          <div className="text-2xl font-bold text-[#1d9e56] mt-1">{money(data.estimated_revenue)}</div>
          <div className="text-xs text-slate-500 mt-1">Estimated revenue</div>
        </div>
      </div>
    </div>
  );
}