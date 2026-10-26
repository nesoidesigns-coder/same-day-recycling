import { ArrowLeft, MapPin, ShieldCheck, TrendingDown, TrendingUp, Minus, Sparkles, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const METRIC_LABELS = {
  first_party_searches: "Searches on this platform",
  platform_inquiries: "Requests through our platform",
  confirmed_bookings: "Confirmed jobs",
};

function MetricRow({ label, value, note, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 py-2.5 last:border-0">
      <div className="flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#187B65]" />}
        <div>
          <p className="text-sm font-semibold text-[#102B2A]">{label}</p>
          {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
        </div>
      </div>
      <p className="shrink-0 text-lg font-bold text-[#102B2A]">{value}</p>
    </div>
  );
}

// Detail card for a selected search topic. Every number carries its basis in
// plain language; an unconnected topic shows an explicit unavailable state.
export default function GaugeNodeDetail({ industry, subdivision, topic, onClose }) {
  const navigate = useNavigate();
  const stats = topic?.stats || {};
  const interest = stats.interest;
  const TrendIcon = interest ? ({ rising: TrendingUp, falling: TrendingDown, steady: Minus })[interest.direction] || null : null;
  const hasData = stats.connected;
  const province = (stats.cities || []).find((c) => c.province_code)?.province_code || "";

  const openRex = () => {
    window.dispatchEvent(new CustomEvent("rex:open", {
      detail: {
        question: `I'm exploring "${topic.name}" (${subdivision.name}, under ${industry.name}) in Canada. Help me figure out what I'm actually trying to accomplish and suggest only the services that fit — don't assume I need everything, and hold off on availability or pricing until those are confirmed.`,
      },
    }));
  };

  const showOnMap = () => {
    document.getElementById("recycling-centers")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#187B65]">{industry.name} · {subdivision.name}</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#102B2A]">{topic.name}</h3>
        </div>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-slate-400" aria-label="Back to the gauge">
          <ArrowLeft className="h-3.5 w-3.5" /> Gauge
        </button>
      </div>

      {hasData ? (
        <div className="mt-3">
          {interest && (
            <MetricRow
              label="Relative search interest"
              icon={TrendIcon && interest.direction !== "steady" ? TrendIcon : undefined}
              value={`${Math.round(interest.index)}/100`}
              note={`Source-reported index (${interest.provider}) for ${interest.period}. An index, not a count of searches. Trend: ${interest.direction}.`}
            />
          )}
          {stats.first_party_searches > 0 && <MetricRow label={METRIC_LABELS.first_party_searches} value={stats.first_party_searches} note={stats.first_party_trend?.note} icon={Search} />}
          {stats.platform_inquiries > 0 && <MetricRow label={METRIC_LABELS.platform_inquiries} value={stats.platform_inquiries} icon={Sparkles} />}
          {stats.confirmed_bookings > 0 && <MetricRow label={METRIC_LABELS.confirmed_bookings} value={stats.confirmed_bookings} note="Completed through Recycling OS." icon={ShieldCheck} />}
          {(stats.cities || []).length > 0 && (
            <div className="border-b border-slate-200/70 py-2.5 last:border-0">
              <p className="text-sm font-semibold text-[#102B2A]">Where these signals come from</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats.cities.map((c) => (
                  <span key={c.city} className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 px-2.5 py-1 text-xs font-bold text-[#102B2A]"><MapPin className="h-3 w-3 text-[#187B65]" />{c.city}{c.count > 1 ? ` · ${c.count}` : ""}</span>
                ))}
              </div>
              {!province && <p className="mt-2 text-xs text-slate-500">City detail beyond this list isn't available from connected sources.</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-slate-50 p-4">
          <p className="flex items-start gap-2 text-sm text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#187B65]" />No connected data for this topic yet. We don't estimate numbers we can't verify — this panel fills in as more sources connect.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(`/service-finder?q=${encodeURIComponent(`${topic.name} — I need help with this`)}`)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#187B65] px-5 text-sm font-bold text-white hover:bg-[#125C4E]">
          <Search className="h-4 w-4" /> Find help near you
        </button>
        <button type="button" onClick={openRex} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-bold text-[#102B2A] hover:border-[#187B65]">
          <Sparkles className="h-4 w-4 text-[#187B65]" /> Ask Rex what fits
        </button>
        {(stats.cities || []).length > 0 && (
          <button type="button" onClick={showOnMap} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-bold text-[#102B2A] hover:border-[#187B65]">
            <MapPin className="h-4 w-4 text-[#187B65]" /> See on the Canadian map
          </button>
        )}
      </div>
    </div>
  );
}