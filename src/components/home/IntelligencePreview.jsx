import { useEffect, useState } from "react";
import { ClipboardList, MapPin, Radio, LayoutGrid, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Four above-the-fold intelligence cards, each driven by real platform
// records through the liveIntelligence feed. Every card carries its timeframe
// and data-source label. Zero is never shown in place of missing data — the
// empty state says what's happening instead.

const EMPTY_NOTE = "Collecting verified observations.";

export default function IntelligencePreview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.functions.invoke("liveIntelligence", { action: "overview", days: 30 })
      .then((res) => alive && setData(res.data))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-sm text-slate-500">
        Live intelligence is unavailable right now. Please try again shortly.
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading live platform data…
      </div>
    );
  }

  const cards = [
    {
      icon: ClipboardList,
      title: "Service Requests",
      m: data.service_requests,
      unit: "verified service requests",
      sub: null,
    },
    {
      icon: MapPin,
      title: "Active Service Areas",
      m: data.service_areas,
      unit: "cities with verified coverage",
      sub: data.service_areas.available ? `${data.service_areas.contractors} verified contractor${data.service_areas.contractors === 1 ? "" : "s"} · ${data.service_areas.cities.slice(0, 4).join(", ")}${data.service_areas.cities.length > 4 ? " +" + (data.service_areas.cities.length - 4) : ""}` : null,
    },
    {
      icon: Radio,
      title: "Market Signals",
      m: data.market_signals,
      unit: "external demand observations",
      sub: data.market_signals.available
        ? Object.entries(data.market_signals.by_source || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : null,
    },
    {
      icon: LayoutGrid,
      title: "Service Categories",
      m: { value: data.service_categories.count, available: data.service_categories.count > 0, source: data.service_categories.source },
      unit: "categories with recorded demand",
      sub: data.service_categories.count > 0 ? null : EMPTY_NOTE,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const has = Boolean(c.m) && c.m.available !== false && c.m.value > 0;
        return (
          <div key={c.title} className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center gap-2 text-[#187B65]">
              <c.icon className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-slate-500">{c.title}</span>
            </div>
            {has ? (
              <div className="mt-2 text-3xl font-bold text-[#102B2A] tabular-nums">{c.m.value.toLocaleString("en-CA")}</div>
            ) : (
              <div className="mt-2 text-sm font-semibold text-slate-500">{EMPTY_NOTE}</div>
            )}
            <p className="mt-1.5 text-xs text-slate-600">{has ? c.unit : ""}</p>
            {c.sub && <p className="mt-1 text-[11px] text-slate-500 leading-snug">{c.sub}</p>}
            {c.m && (
              <p className="mt-auto pt-2 text-[10px] text-slate-400 leading-snug">
                {`Last 30 days · Source: ${c.m.source}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}