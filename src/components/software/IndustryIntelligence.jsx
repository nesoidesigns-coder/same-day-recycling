import { Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import HoloGauge from "@/components/software/HoloGauge";

// Verified figures — Environment and Climate Change Canada, "Solid waste diversion
// and disposal" indicator (2024 release, data through the 2022 reporting year),
// based on Statistics Canada's Waste Management Survey. Nothing below is invented.
export const SOURCE_LINE = "Source: Environment and Climate Change Canada, Solid waste diversion and disposal indicator — data through the 2022 reporting year, from Statistics Canada's Waste Management Survey.";

const CHART_DATA = [
  { year: 2002, diverted: 6.64, disposed: 24.08 },
  { year: 2004, diverted: 7.11, disposed: 25.23 },
  { year: 2006, diverted: 7.63, disposed: 26.42 },
  { year: 2008, diverted: 8.31, disposed: 25.93 },
  { year: 2010, diverted: 8.1, disposed: 24.95 },
  { year: 2012, diverted: 8.47, disposed: 24.68 },
  { year: 2014, diverted: 9.08, disposed: 24.77 },
  { year: 2016, diverted: 9.28, disposed: 24.94 },
  { year: 2018, diverted: 9.55, disposed: 25.73 },
  { year: 2020, diverted: 9.9, disposed: 26.11 },
  { year: 2022, diverted: 9.9, disposed: 26.62 },
];

const CARDS = [
  { k: "36.5 Mt", v: "Solid waste generated in Canada", yr: "2022" },
  { k: "9.9 Mt", v: "Diverted by recycling or composting", yr: "2022" },
  { k: "26.6 Mt", v: "Sent to landfill or incineration", yr: "2022" },
  { k: "254 kg", v: "Waste diverted per person", yr: "2022" },
];

const HOW_OS_HELPS = [
  { stat: "59.8% of disposed waste comes from the non-residential sector", point: "Commercial and institutional accounts are the biggest volume pool — the customer CRM and commercial quote tools help you capture and manage them." },
  { stat: "Diverted waste grew 49% from 2002 to 2022", point: "More diversion means more pickup jobs. Dispatch and scheduling keep that growth organized instead of overwhelming your calendar." },
  { stat: "26.6 Mt still goes to landfill every year", point: "Every load is an opportunity. Inquiry capture, dispatch boards and invoicing turn calls into scheduled, paid jobs." },
  { stat: "254 kg diverted per person, up 20% since 2002", point: "Analytics gauges show your completion rate, volume and revenue trends so you can scale with the market." },
];

const tooltipStyle = {
  backgroundColor: "#06251b",
  border: "1px solid rgba(24,123,101,0.4)",
  borderRadius: "12px",
  color: "#e2f5ec",
};

export default function IndustryIntelligence() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-16" id="industry-intelligence">
      <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-6 md:p-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] uppercase text-[#54D9AE]">
            <Info className="w-3.5 h-3.5" /> Industry intelligence · reporting year 2022
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-4">Canadian Recycling Industry Intelligence</h2>
          <p className="text-emerald-100/60 mt-3 max-w-2xl mx-auto text-sm">
            Verified figures from Environment and Climate Change Canada and Statistics Canada's Waste Management Survey — the same market your operation competes in.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {CARDS.map((s) => (
            <div key={s.k} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-[#54D9AE] holo-glow-text">{s.k}</div>
                <span className="text-[10px] font-bold text-emerald-100/40">{s.yr}</span>
              </div>
              <div className="text-xs text-emerald-100/60 mt-1">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <HoloGauge value={27.1} label="National diversion rate" sub="Of solid waste generated, 2022" />
          <HoloGauge value={72.9} label="Sent to disposal" sub="Landfill or incineration, 2022" />
          <HoloGauge value={59.8} label="Non-residential share of disposal" sub="Commercial & institutional, 2022" />
          <HoloGauge value={49} label="Diversion growth" sub="2002 to 2022 (+3.3 Mt)" />
        </div>

        {/* Chart */}
        <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-4 md:p-6 mb-10">
          <div className="text-sm font-bold text-[#54D9AE] mb-1">Waste diverted vs. disposed, Canada, 2002–2022</div>
          <div className="text-xs text-emerald-100/50 mb-4">Million tonnes per year. Source: ECCC (2024 release).</div>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#187B65" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#187B65" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="dispGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#54D9AE" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#54D9AE" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(24,123,101,0.15)" />
                <XAxis dataKey="year" tick={{ fill: "#8fd8bf", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(24,123,101,0.3)" }} />
                <YAxis tick={{ fill: "#8fd8bf", fontSize: 11 }} tickLine={false} axisLine={false} unit=" Mt" width={62} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} Mt`} />
                <Area type="monotone" dataKey="disposed" name="Disposed" stroke="#9fe8cf" strokeWidth={1.5} fill="url(#dispGrad)" />
                <Area type="monotone" dataKey="diverted" name="Diverted" stroke="#187B65" strokeWidth={2.5} fill="url(#divGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* How the OS helps */}
        <div>
          <div className="text-sm font-bold tracking-[0.16em] uppercase text-[#187B65] mb-5">What this means for your operation</div>
          <div className="grid md:grid-cols-2 gap-4">
            {HOW_OS_HELPS.map((h) => (
              <div key={h.stat} className="rounded-2xl border border-[#187B65]/20 bg-[#187B65]/5 p-5">
                <div className="text-sm font-bold text-white">{h.stat}</div>
                <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{h.point}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-emerald-100/40 leading-relaxed">{SOURCE_LINE}</p>
      </div>
    </div>
  );
}