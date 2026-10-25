import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Compass, RefreshCw, Search, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IndustryGauge from "@/components/demand/IndustryGauge";
import GaugeNodeDetail from "@/components/demand/GaugeNodeDetail";

// Consumer-facing national demand intelligence: one interactive gauge of
// Canadian industries → subdivisions → search topics, backed only by real
// connected sources. No account needed; the main search stays one tap away.
export default function NationalDemandPanel() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState({ industry: null, subdivision: null, topic: null });

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["national-demand-gauge"],
    queryFn: async () => (await base44.functions.invoke("nationalDemand", { action: "gauge" })).data,
    staleTime: 5 * 60000,
    retry: 1,
  });

  const industry = useMemo(() => data?.industries?.find((i) => i.slug === sel.industry) || null, [data, sel.industry]);
  const subdivision = industry?.subdivisions?.find((s) => s.slug === sel.subdivision) || null;
  const topic = subdivision?.topics?.find((t) => t.slug === sel.topic) || null;

  const pick = (ringKey, item) => {
    if (ringKey === "outer") setSel({ industry: item.slug, subdivision: null, topic: null });
    else if (ringKey === "middle") setSel((s) => ({ ...s, subdivision: item.slug, topic: null }));
    else {
      setSel((s) => ({ ...s, topic: item.slug }));
      base44.analytics.track({ eventName: "national_gauge_topic_select", properties: { topic: item.slug } });
    }
  };
  const back = () => setSel(({ topic, ...s }) => (s.subdivision ? { ...s, subdivision: null } : { industry: null, subdivision: null, topic: null }));

  const rings = {
    outer: (data?.industries || []).map((i) => ({ slug: i.slug, name: i.name, weight: i.weight || 0 })),
    middle: industry ? industry.subdivisions.map((s) => ({ slug: s.slug, name: s.name, weight: Math.max(0, ...s.topics.map((t) => t.stats.weight || 0)) })) : null,
    inner: subdivision ? subdivision.topics.map((t) => ({ slug: t.slug, name: t.name, weight: t.stats.weight || 0 })) : null,
  };

  const chips = rings.inner || rings.middle || rings.outer;
  const chipLevel = rings.inner ? "inner" : rings.middle ? "middle" : "outer";
  const selectedSlug = chipLevel === "inner" ? sel.topic : chipLevel === "middle" ? sel.subdivision : sel.industry;

  const counts = data?.counts;
  const go = (e) => { e.preventDefault(); if (query.trim()) navigate(`/recycling?q=${encodeURIComponent(query.trim())}`); };

  return (
    <section className="relative bg-[#102B2A] py-10 text-white sm:py-14" aria-label="Canadian demand intelligence">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300"><Compass className="h-3.5 w-3.5" /> National demand intelligence</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What Canada needs, in one gauge</h2>
          <p className="mt-2 text-sm text-emerald-100/70">Explore industries, their specialties and the searches inside them — built only from connected sources. No account needed.</p>
        </div>

        {/* Prominent search — booking and service-finding stay immediately accessible */}
        <form onSubmit={go} className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need help with today?" aria-label="What do you need help with today?" className="input !bg-white" />
          </div>
          <button type="submit" className="rounded-xl bg-[#187B65] px-6 py-3 font-bold text-white transition-colors hover:bg-[#125C4E]">Search</button>
        </form>

        {/* Gauge */}
        <div className="mt-8">
          {isError ? (
            <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm text-emerald-100/80">The demand gauge couldn't load right now. Your booking tools are unaffected.</p>
              <button type="button" onClick={() => refetch()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#187B65] px-5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> Try again</button>
            </div>
          ) : (
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <IndustryGauge
                rings={rings}
                selected={{ outer: sel.industry, middle: sel.subdivision, inner: sel.topic }}
                onSelect={pick}
                onBack={back}
                loading={isLoading}
                centerTitle={industry ? industry.name : "NATIONAL DEMAND"}
                centerSub={counts ? `${counts.connected_topics} of ${counts.topics} topics with connected data` : null}
              />
              <div className="min-w-0">
                {/* Level chips: the accessible, thumb-friendly way to navigate */}
                <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
                  {(chipLevel !== "outer" || sel.industry) && (
                    <button type="button" onClick={back} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-emerald-400/40 px-3 text-xs font-bold text-emerald-200 hover:bg-white/5">
                      <ArrowLeft className="h-3 w-3" /> {chipLevel === "inner" ? subdivision.name : industry.name}
                    </button>
                  )}
                  {chips.map((chip) => (
                    <button
                      key={chip.slug}
                      type="button"
                      aria-pressed={selectedSlug === chip.slug}
                      onClick={() => pick(chipLevel, chip)}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${selectedSlug === chip.slug ? "border-[#54D9AE] bg-[#187B65]/30 text-white" : chip.weight > 0 ? "border-emerald-400/30 text-emerald-100 hover:border-emerald-300" : "border-white/15 text-emerald-100/50"}`}
                    >
                      {chip.weight > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#54D9AE]" aria-hidden="true" />}
                      {chip.name}
                    </button>
                  ))}
                </div>
                {topic ? (
                  <div className="mt-4">
                    <GaugeNodeDetail industry={industry} subdivision={subdivision} topic={topic} onClose={back} />
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-emerald-100/70">
                    <p><span className="font-bold text-white">How to read the gauge:</span> the outer ring is an industry, the middle ring its specialties, the inner ring individual searches. Brighter green means stronger connected demand; dashed grey means no connected data yet — we say so rather than guess.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Data honesty footer */}
        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-4 text-center text-xs text-emerald-100/60">
          <p className="font-bold text-emerald-100/90">{data?.data_integrity?.statement || "Only real connected data is shown here — never simulated counts."}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {(data?.data_integrity?.sources || []).map((s) => <span key={s.key} className="rounded-full bg-white/5 px-2.5 py-1">{s.label}</span>)}
            {data?.generated_at && (
              <button type="button" onClick={() => refetch()} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 py-1 underline hover:text-white">
                <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} /> Updated {new Date(data.generated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </button>
            )}
          </div>
          <p className="mt-2">Search interest is a source-reported index, not a count of searches. Geographic detail appears only where a source supports it.</p>
        </div>
      </div>
    </section>
  );
}