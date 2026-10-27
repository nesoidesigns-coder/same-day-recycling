import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useLiveGauge from "@/hooks/useLiveGauge";

// Mounted only when the footer's Live tab is opened, so the verified feed is
// fetched on demand rather than on every page with a footer.
export default function FooterLiveStrip() {
  const { data, loading } = useLiveGauge({ days: 30 });
  const total = data?.total || 0;
  const cities = data?.cities || [];
  const top = cities[0];

  return (
    <div className="mb-3 rounded-xl border border-ri-amber/25 bg-white/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-heading text-[18px] font-extrabold leading-none text-white tabular-nums">
              {loading ? "—" : total}
            </div>
            <div className="mt-0.5 font-plex text-[8.5px] font-bold uppercase tracking-[0.16em] text-ri-ivory/50">
              Observations · 30D
            </div>
          </div>
          <div>
            <div className="font-heading text-[18px] font-extrabold leading-none text-white tabular-nums">
              {loading ? "—" : cities.length}
            </div>
            <div className="mt-0.5 font-plex text-[8.5px] font-bold uppercase tracking-[0.16em] text-ri-ivory/50">
              Cities with demand
            </div>
          </div>
          {top && (
            <div>
              <div className="font-heading text-[13px] font-extrabold leading-tight text-white">{top.city}</div>
              <div className="mt-0.5 font-plex text-[8.5px] font-bold uppercase tracking-[0.16em] text-ri-ivory/50">
                Top city · {top.count}
              </div>
            </div>
          )}
        </div>
        <Link to="/live" className="inline-flex items-center gap-1 text-[11px] font-bold text-ri-amber hover:underline">
          Open the live radar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}