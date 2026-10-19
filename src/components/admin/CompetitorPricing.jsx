import { useState, useEffect } from "react";
import { Loader2, RefreshCw, ExternalLink, Users, AlertCircle, Minimize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const OWN_FIELDS = [
  ["minimum_pickup", "Min pickup"],
  ["eighth_truck", "1/8 truck"],
  ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"],
  ["three_quarter_truck", "3/4 truck"],
  ["full_truck", "Full truck"],
];

export default function CompetitorPricing() {
  const [rows, setRows] = useState(null);
  const [own, setOwn] = useState(null);
  const [summary, setSummary] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { items } = await base44.entities.CompetitorPricing.filter({}, { sort: "-created_date", limit: 50 });
      setRows(items);
      if (items[0]?.market_summary) setSummary(items[0].market_summary);
    } catch {
      setRows([]);
    }
  };

  const loadOwn = async () => {
    try {
      const { items } = await base44.entities.PricingSettings.filter({}, { limit: 1 });
      setOwn(items[0] || null);
    } catch {
      setOwn(null);
    }
  };

  useEffect(() => {
    load();
    loadOwn();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await base44.functions.invoke("competitorPricing", { action: "refresh" });
      if (res.data?.summary) setSummary(res.data.summary);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-bold text-[#0c3b24] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1d9e56]" /> Competitor pricing &amp; services
        </h2>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="shrink-0 flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-4 py-2 text-xs hover:bg-[#17a04c] transition-colors disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {refreshing ? "Researching…" : "Pull from web"}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Live web research on local junk removal competitors, stored and compared against your rates.
      </p>

      {own && (
        <div className="mb-5 rounded-xl bg-[#0c3b24] p-4">
          <div className="text-xs font-bold tracking-[0.15em] text-[#1d9e56] uppercase mb-2">Your rates</div>
          <div className="grid grid-cols-3 gap-2">
            {OWN_FIELDS.map(([key, label]) => (
              <div key={key}>
                <div className="text-[11px] text-white/60">{label}</div>
                <div className="text-sm font-bold text-white">${own[key] ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {summary && (
        <p className="text-sm text-slate-700 bg-[#f4f7f5] rounded-xl p-4 mb-5">{summary}</p>
      )}

      {rows === null && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" />
        </div>
      )}
      {rows !== null && rows.length === 0 && (
        <p className="text-sm text-slate-500">No competitor data yet — tap “Pull from web” to research the local market.</p>
      )}
      {rows !== null && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl bg-[#f4f7f5] p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="font-bold text-[#0c3b24] text-sm">{c.name}</p>
                <span className="text-[11px] font-bold text-[#1d9e56] bg-white border border-[#1d9e56]/30 rounded-full px-2.5 py-1">
                  {c.city || "Metro Vancouver"}
                </span>
              </div>
              {c.price_range && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <Minimize2 className="w-3.5 h-3.5 text-[#1d9e56]" />
                  <span className="text-slate-600">Load price:</span>
                  <span className="font-bold text-[#0c3b24]">{c.price_range}</span>
                </div>
              )}
              {c.minimum && (
                <div className="mt-1 text-sm text-slate-600">
                  Minimum: <span className="font-semibold text-[#0c3b24]">{c.minimum}</span>
                </div>
              )}
              {c.services && (
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{c.services}</p>
              )}
              {c.note && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{c.note}</p>
              )}
              {c.source_url && (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1d9e56] hover:underline break-all"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" /> Source
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}