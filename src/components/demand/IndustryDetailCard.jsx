import { MapPin, Search, Sparkles, ShieldCheck, TrendingDown, TrendingUp, Minus, Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, steady: Minus };

function TrendingRow({ topic }) {
  const interest = topic.stats.interest;
  const TrendIcon = interest ? TREND_ICON[interest.direction] || null : null;
  return (
    <div className="flex items-center gap-3 border-b border-slate-200/70 py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#102B2A]">{topic.name}</p>
        {interest && <p className="text-[11px] text-slate-500">Source-reported index ({interest.provider}), {interest.period} · trend {interest.direction}</p>}
      </div>
      <div className="flex w-28 shrink-0 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max(2, Math.round(interest?.index || 0))}%` }} />
        </div>
        <span className="w-9 text-right text-xs font-bold text-[#102B2A]">{interest ? Math.round(interest.index) : "-"}</span>
        {TrendIcon && <TrendIcon className={`h-3.5 w-3.5 shrink-0 ${interest.direction === "rising" ? "text-[#187B65]" : interest.direction === "falling" ? "text-slate-400" : "text-slate-400"}`} />}
      </div>
    </div>
  );
}

// Detail card shown when an industry segment is clicked on the gauge:
// its top trending searches and local demand, aggregated from the connected
// topics. Every figure keeps its basis — indices are never search counts.
export default function IndustryDetailCard({ industry, onClose }) {
  const navigate = useNavigate();
  const topics = (industry.subdivisions || []).flatMap((s) => s.topics || []);
  const trending = topics
    .filter((t) => t.stats.connected && t.stats.interest)
    .sort((a, b) => (b.stats.interest.index || 0) - (a.stats.interest.index || 0))
    .slice(0, 5);

  // Local demand: merge city counts across the industry's connected topics.
  const cityTotals = new Map();
  let searches = 0, inquiries = 0, bookings = 0;
  for (const t of topics) {
    const s = t.stats || {};
    searches += s.first_party_searches || 0;
    inquiries += s.platform_inquiries || 0;
    bookings += s.confirmed_bookings || 0;
    for (const c of s.cities || []) cityTotals.set(c.city, (cityTotals.get(c.city) || 0) + (c.count || 0));
  }
  const cities = [...cityTotals.entries()].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#187B65]">Industry · {industry.connected_topics} connected search topics</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#102B2A]">{industry.name}</h3>
          {industry.blurb && <p className="mt-1 text-sm text-slate-500">{industry.blurb}</p>}
        </div>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-slate-400" aria-label="Back to the gauge">
          Gauge
        </button>
      </div>

      {trending.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#102B2A]">Top trending searches in this industry</p>
          <div className="mt-1">
            {trending.map((t) => <TrendingRow key={t.slug} topic={t} />)}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">No source-reported search interest for this industry yet — it fills in as more sources connect.</p>
        </div>
      )}

      {(searches > 0 || inquiries > 0 || bookings > 0) && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <Search className="mx-auto h-4 w-4 text-[#187B65]" />
            <p className="mt-1 text-lg font-bold text-[#102B2A]">{searches}</p>
            <p className="text-[11px] leading-tight text-slate-500">Searches on this platform</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <Sparkles className="mx-auto h-4 w-4 text-[#187B65]" />
            <p className="mt-1 text-lg font-bold text-[#102B2A]">{inquiries}</p>
            <p className="text-[11px] leading-tight text-slate-500">Requests through our platform</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <ShieldCheck className="mx-auto h-4 w-4 text-[#187B65]" />
            <p className="mt-1 text-lg font-bold text-[#102B2A]">{bookings}</p>
            <p className="text-[11px] leading-tight text-slate-500">Confirmed jobs</p>
          </div>
        </div>
      )}

      {cities.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#102B2A]">Where demand is coming from</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cities.map((c) => (
              <span key={c.city} className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 px-2.5 py-1 text-xs font-bold text-[#102B2A]"><MapPin className="h-3 w-3 text-[#187B65]" />{c.city}{c.count > 1 ? ` · ${c.count}` : ""}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">City detail appears only where a connected source supports it.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(`/service-finder?q=${encodeURIComponent(`${industry.name} — I need help with this`)}`)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#187B65] px-5 text-sm font-bold text-white hover:bg-[#125C4E]">
          <SearchIcon className="h-4 w-4" /> Find help near you
        </button>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-bold text-[#102B2A] hover:border-[#187B65]">
          Explore specialties
        </button>
      </div>
    </div>
  );
}