import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search } from "lucide-react";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Estimated search demand in the contractor's own city, from the external
// search-volume source only. Search activity is never presented as leads, and
// a missing measurement reads "Data unavailable" instead of a guess.
export default function LocalDemand({ city }) {
  const [data, setData] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!city) { setData(false); return; }
    base44.functions.invoke("demandReport", { view: "command", filters: { engine: "google", city } })
      .then((r) => setData(r.data))
      .catch(() => setFailed(true));
  }, [city]);

  if (data === null && !failed) {
    return <div className={`${panel} p-6 text-center mb-10`}><Loader2 className="w-5 h-5 text-[#187B65] animate-spin mx-auto" /></div>;
  }

  const overview = data?.overview || {};
  const available = !failed && overview.available === true && Number(overview.value) > 0;

  return (
    <div className={`${panel} p-5 mb-10`}>
      <h2 className="text-xl font-bold text-white tracking-tight mb-1">Estimated search demand in {city || "your area"}</h2>
      <p className="text-xs text-emerald-100/40 mb-4">
        Monthly search estimates for removal services in this city, from the external search-volume source. This is market search activity, not leads reserved or promised to you.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#187B65]/25 p-4">
          <div className={label}>Estimated monthly searches</div>
          <div className="text-lg font-bold text-white mt-2 tabular-nums flex items-center gap-1.5">
            <Search className="w-4 h-4 text-[#187B65]" />
            {available ? Number(overview.value).toLocaleString("en-CA") : "Data unavailable"}
          </div>
          <p className="text-[11px] text-emerald-100/40 mt-1">
            {available
              ? `Reporting period ${overview.period || "—"}${overview.sources?.length ? ` · ${overview.sources.join(", ")}` : ""}`
              : "No verified search-volume data on file for this city yet. Platform requests in your area are shown in your performance figures above."}
          </p>
        </div>
      </div>
    </div>
  );
}