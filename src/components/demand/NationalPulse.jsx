import { useEffect, useState } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DataSourceLabel from "@/components/li/DataSourceLabel";
import MetricGauge from "@/components/os/MetricGauge";

const SECTORS = [
  { key: "furniture_appliance_removal", label: "Furniture & Appliances", short: "Furniture" },
  { key: "moving_downsizing", label: "Moving & Downsizing", short: "Moving" },
  { key: "renovation_construction_debris", label: "Renovation & Construction", short: "Renovation" },
  { key: "property_management_turnover", label: "Property Turnover", short: "Property" },
  { key: "recycling_specialty_disposal", label: "Recycling & Specialty", short: "Recycling" },
  { key: "commercial_office_cleanouts", label: "Commercial Cleanouts", short: "Commercial" },
  { key: "urgent_same_day", label: "Urgent Same-Day", short: "Same-Day" },
  { key: "donation_reuse_circular", label: "Donation & Reuse", short: "Donation" },
];

const TYPE_LABELS = {
  observed_public_request: "Observed public requests",
  search_interest: "Search interest",
  platform_inquiry: "Platform inquiries",
  confirmed_booking: "Confirmed bookings",
  qualified_opportunity: "Qualified opportunities",
  market_indicator: "Market indicators",
};

const PROVINCES = [
  ["", "All of Canada"], ["BC", "British Columbia"], ["AB", "Alberta"], ["SK", "Saskatchewan"],
  ["MB", "Manitoba"], ["ON", "Ontario"], ["QC", "Quebec"], ["NB", "New Brunswick"],
  ["NS", "Nova Scotia"], ["PE", "Prince Edward Island"], ["NL", "Newfoundland"],
];


export default function NationalPulse() {
  const [national, setNational] = useState(null);
  const [province, setProvince] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingNational, setLoadingNational] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingNational(true);
      try {
        const res = await base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30, province });
        setNational(res.data);
        if (res.data?.rows?.length) {
          const top = res.data.rows[0].key;
          setSelected(top);
        }
      } finally {
        setLoadingNational(false);
      }
    })();
  }, [province]);

  useEffect(() => {
    if (!selected) { setDetail(null); return undefined; }
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await base44.functions.invoke("liveIntelligence", { action: "gauge", days: 90, province, category: selected });
        if (!cancelled) setDetail(res.data);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected, province]);

  const counts = Object.fromEntries((national?.rows || []).map((r) => [r.key, r.count]));
  const total = national?.total ?? 0;
  const selectedSector = SECTORS.find((s) => s.key === selected);
  const detailRow = detail?.rows?.[0];
  const maxTrend = Math.max(1, ...(detail?.trend || []).map((t) => t.count));

  return (
    <section id="national-pulse" className="py-14">
      <div className="max-w-2xl mb-6">
        <div className="text-xs font-bold tracking-[0.2em] text-li-infra uppercase mb-3">One country · one pulse</div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-li-carbon">
          The National Pulse
        </h2>
        <p className="mt-3 text-li-slate">
          Live demand from every sector, coast to coast. Tap a sector to command the view — the centre
          responds instantly with real measured data.
        </p>
      </div>

      {/* Province filter */}
      <div className="flex items-center gap-2 mb-8">
        <span className="font-plex text-[11px] font-semibold text-li-slate uppercase tracking-wider">Scope</span>
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="input max-w-[240px] py-2.5" aria-label="Filter by province">
          {PROVINCES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>

      {loadingNational ? (
        <div className="rounded-3xl border border-li-steel bg-white p-12 flex justify-center" role="status">
          <Loader2 className="w-6 h-6 animate-spin text-li-infra" />
        </div>
      ) : !total ? (
        <div className="rounded-3xl border border-li-steel bg-white p-6 text-sm text-li-slate">
          No demand observations recorded for this selection yet — the pulse fills in as real signals arrive.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-stretch">
          {/* Central pulse gauge */}
          <div className="rounded-3xl bg-li-forest text-white p-6 flex flex-col items-center justify-center text-center">
            <MetricGauge value={counts[selected] || 0} max={total} display={detailRow ? detailRow.count : counts[selected] || 0} loading={loadingDetail} label="National demand pulse" unit={`${selectedSector ? selectedSector.short : "All sectors"} signals`} appearance="dark" size={260} />
            <div className="mt-4 font-plex text-[11px] text-white/60 leading-relaxed">
              {province ? `${PROVINCES.find(([c]) => c === province)?.[1] || province} · ` : "Canada · "}
              last 30 days · {total} total signals
            </div>
          </div>

          {/* Sector selector + detail */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelected(s.key)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    selected === s.key
                      ? "bg-li-forest border-li-forest text-white shadow-md"
                      : "bg-white border-li-steel text-li-carbon hover:border-li-infra"
                  }`}
                >
                  <div className="text-[13px] font-bold leading-tight">{s.short}</div>
                  <div className={`font-plex text-lg font-bold ${selected === s.key ? "text-li-mint" : "text-li-infra"}`}>
                    {counts[s.key] ?? 0}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-li-steel bg-white p-6 flex-1">
              {loadingDetail ? (
                <div className="h-40 flex items-center justify-center" role="status">
                  <Loader2 className="w-5 h-5 animate-spin text-li-infra" />
                </div>
              ) : !detailRow ? (
                <p className="text-sm text-li-slate flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-li-infra" />
                  No {selectedSector?.short} signals in this scope right now — pick another sector.
                </p>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-li-carbon mb-4">
                    {selectedSector?.label} <span className="text-li-slate font-semibold text-sm">· measured by type</span>
                  </h3>
                  <div className="space-y-3 mb-6">
                    {Object.entries(detailRow.demand_types).map(([type, n]) => (
                      <div key={type}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-medium text-li-carbon">{TYPE_LABELS[type] || type}</span>
                          <span className="font-plex text-sm font-bold text-li-infra">{n}</span>
                        </div>
                        <div className="h-2 rounded-full bg-li-pale overflow-hidden">
                          <div className="h-full rounded-full bg-li-infra" style={{ width: `${detailRow.count ? Math.round((n / detailRow.count) * 100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {detail.cities?.length ? (
                    <div className="mb-6">
                      <div className="font-plex text-[11px] font-semibold text-li-slate uppercase tracking-wider mb-2">Most active municipalities</div>
                      <div className="flex flex-wrap gap-2">
                        {detail.cities.slice(0, 6).map((c) => (
                          <span key={c.city} className="rounded-full bg-li-cloud border border-li-steel px-3 py-1 text-xs font-semibold text-li-carbon">
                            {c.city} <span className="font-plex text-li-infra">{c.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {detail.trend?.length ? (
                    <div>
                      <div className="font-plex text-[11px] font-semibold text-li-slate uppercase tracking-wider mb-2">90-day trend</div>
                      <div className="flex items-end gap-1.5 h-16">
                        {detail.trend.map((t) => (
                          <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-li-mint/70"
                              style={{ height: `${Math.max(6, Math.round((t.count / maxTrend) * 100))}%` }}
                              title={`${t.month}: ${t.count}`}
                            />
                            <span className="font-plex text-[9px] text-li-slate">{t.month.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-li-cloud border border-li-steel p-5">
        <div className="text-sm font-bold text-li-carbon mb-2">How to read the pulse</div>
        <ul className="text-xs text-li-slate space-y-1.5 list-disc pl-4">
          <li>Each sector is measured separately — observed public requests, platform inquiries and confirmed bookings are never blended.</li>
          <li>Search interest is aggregate keyword data, shown only as its own labelled type — never a lead.</li>
          <li>Signals with an unresolved location are never assigned to a city or province.</li>
        </ul>
        <div className="mt-3">
          <DataSourceLabel
            what="Live demand signals"
            scope={province ? PROVINCES.find(([c]) => c === province)?.[1] || province : "Canada"}
            period="rolling 30 & 90 days"
            source="Recycling OS demand records"
            updatedAt={national?.generated_at ? new Date(national.generated_at).toLocaleString("en-CA") : ""}
            basis="verified counts by demand type"
          />
        </div>
      </div>
    </section>
  );
}