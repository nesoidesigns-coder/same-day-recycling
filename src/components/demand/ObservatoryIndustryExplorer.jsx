import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IndustryGauge from "@/components/demand/IndustryGauge";
import GaugeNodeDetail from "@/components/demand/GaugeNodeDetail";
import IndustryDetailCard from "@/components/demand/IndustryDetailCard";

// Observatory central explorer: an interactive industry demand gauge built
// only from connected sources. Segments are EQUAL-SIZE navigation categories
// — never sized as market shares, because no comparable volume dataset
// currently backs a share claim. Colors indicate connected evidence strength.
export default function ObservatoryIndustryExplorer() {
  const [sel, setSel] = useState({ industry: null, subdivision: null, topic: null });

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["observatory-industry-explorer"],
    queryFn: async () => (await base44.functions.invoke("nationalDemand", { action: "gauge" })).data,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const industry = useMemo(() => data?.industries?.find((i) => i.slug === sel.industry) || null, [data, sel.industry]);
  const subdivision = industry?.subdivisions?.find((s) => s.slug === sel.subdivision) || null;
  const topic = subdivision?.topics?.find((t) => t.slug === sel.topic) || null;

  const pick = (ringKey, item) => {
    if (ringKey === "outer") setSel({ industry: item.slug, subdivision: null, topic: null });
    else if (ringKey === "middle") setSel((s) => ({ ...s, subdivision: item.slug, topic: null }));
    else setSel((s) => ({ ...s, topic: item.slug }));
  };
  const back = () => setSel(({ topic: _skip, ...s }) => (s.subdivision ? { ...s, subdivision: null } : { industry: null, subdivision: null, topic: null }));

  const rings = {
    outer: (data?.industries || []).map((i) => ({ slug: i.slug, name: i.name, weight: i.weight || 0 })),
    middle: industry ? industry.subdivisions.map((s) => ({ slug: s.slug, name: s.name, weight: Math.max(0, ...s.topics.map((t) => t.stats.weight || 0)) })) : null,
    inner: subdivision ? subdivision.topics.map((t) => ({ slug: t.slug, name: t.name, weight: t.stats.weight || 0 })) : null,
  };

  const chips = rings.inner || rings.middle || rings.outer;
  const chipLevel = rings.inner ? "inner" : rings.middle ? "middle" : "outer";
  const selectedSlug = chipLevel === "inner" ? sel.topic : chipLevel === "middle" ? sel.subdivision : sel.industry;

  const counts = data?.counts;

  if (isError) {
    return (
      <div className="rounded-2xl border border-market-line bg-market-bg p-5 text-center">
        <p className="text-sm text-market-muted">The industry explorer couldn't load right now.</p>
        <button type="button" onClick={() => refetch()} className="mt-3 inline-flex items-center gap-2 rounded-full border border-market-accent px-4 py-2 text-sm font-bold text-market-accent">
          <Loader2 className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div className="relative">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-market-accent" />
            </div>
          ) : (
            <IndustryGauge
              rings={rings}
              selected={{ outer: sel.industry, middle: sel.subdivision, inner: sel.topic }}
              onSelect={pick}
              onBack={back}
              loading={false}
              centerTitle="CANADIAN DEMAND"
              centerSub="Tap a category to explore"
            />
          )}
        </div>
        <div className="min-w-0">
          {/* Level chips: the accessible, thumb-friendly way to navigate */}
          <div className="flex flex-wrap gap-1.5">
            {chipLevel !== "outer" && (
              <button type="button" onClick={back} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-market-accent/50 px-3 text-xs font-bold text-market-ink hover:bg-white/5">
                <ArrowLeft className="h-3 w-3" /> {chipLevel === "inner" ? subdivision.name : industry.name}
              </button>
            )}
            {chips.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                aria-pressed={selectedSlug === chip.slug}
                onClick={() => pick(chipLevel, chip)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${selectedSlug === chip.slug ? "border-[#54D9AE] bg-[#54D9AE]/15 text-white" : chip.weight > 0 ? "border-market-line text-market-ink hover:border-market-accent" : "border-market-line text-market-muted"}`}
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
          ) : industry && !subdivision ? (
            <div className="mt-4">
              <IndustryDetailCard industry={industry} onClose={back} onSelectSubdivision={(s) => pick("middle", s)} />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-market-line bg-market-bg p-4 text-sm text-market-muted">
              <p><span className="font-bold text-market-ink">How to read the gauge:</span> each segment is an industry category (equal-size for navigation), the middle ring its specialties, the inner ring individual searches. Brighter green means more connected evidence; dashed grey means no connected data yet — we say so rather than guess.</p>
              {counts && <p className="mt-2">{counts.connected_topics} of {counts.topics} tracked search topics have connected data right now.</p>}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-market-muted">
        <span className="font-bold text-market-ink">Category segments, not market shares.</span> Comparable Canadian search-volume data does not yet exist for every industry, so all segments are drawn equal-size and are navigation categories only. Colors reflect the strength of connected evidence, never an assumed market share.
      </p>
    </div>
  );
}