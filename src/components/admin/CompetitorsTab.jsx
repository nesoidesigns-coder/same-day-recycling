import { useState } from "react";
import { Eye, RefreshCw, Link2, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const COMPETITORS = [
  {
    name: "1-800-GOT-JUNK?",
    url: "https://www.1800gotjunk.com/ca_en/locations/junk-removal-vancouver/ca04009",
    angle: "National franchise with established brand recognition and multi-city coverage.",
    gap: "No subscription service for recurring property manager cleanups; no multi-city pricing automation.",
  },
  {
    name: "JUSTJUNK",
    url: "https://justjunk.com/junk-removal-vancouver",
    angle: "Established local player with same-day service and transparent pricing model.",
    gap: "No AI receptionist or automated booking platform; partner dispatch network not visible.",
  },
  {
    name: "Removerz Junk Removal",
    url: "https://removerz.ca/",
    angle: "Local service focused on fast, affordable junk removal.",
    gap: "No multi-city marketing site or subscription service for property managers; limited booking automation.",
  },
  {
    name: "Joey's Junk Removal",
    url: "https://www.joeysjunk.ca/",
    angle: "Local operator emphasizing reliability and customer service.",
    gap: "No automated quote calculator, chat receptionist or subscription model for recurring jobs.",
  },
];

export default function CompetitorsTab() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("aiResearch", {
        topic: "Competitor analysis: junk removal and hauling services in major Canadian metros (1-800-GOT-JUNK, JUSTJUNK, Removerz, Joey's Junk Removal) — their current pricing, service guarantees, ad positioning and what they do NOT offer, so Same Day Recycling can target the gaps.",
      });
      setReport(res.data);
    } catch {
      setError("Analysis failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#102B2A] flex items-center gap-2">
          <Eye className="w-5 h-5" /> Competitor Analysis
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Who you're up against in each city — and the gaps you can own.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {COMPETITORS.map((c) => (
          <div key={c.name} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-[#102B2A]">{c.name}</h3>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#187B65] hover:underline"
              >
                <Link2 className="w-3.5 h-3.5" /> Visit
              </a>
            </div>
            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-[#102B2A]">Their angle:</span> {c.angle}</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-[#187B65]">Your opening:</span> {c.gap}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-[#102B2A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#187B65]" /> Fresh web analysis
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Research live competitor pricing, ads and offers across all 7 cities.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="rounded-full bg-[#102B2A] text-[#187B65] font-bold px-5 py-2.5 text-sm hover:bg-[#0a3020] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {report && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-700">{report.summary}</p>
            {report.key_takeaways?.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#102B2A] mb-2">Key takeaways</div>
                <ul className="space-y-1.5">
                  {report.key_takeaways.map((t, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-[#187B65] font-bold">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.opportunities?.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#187B65] mb-2">Opportunities</div>
                <ul className="space-y-1.5">
                  {report.opportunities.map((t, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-[#187B65] font-bold">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.sources?.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Sources</div>
                <ul className="space-y-1">
                  {report.sources.map((s, i) => (
                    <li key={i} className="text-xs text-slate-400 break-words">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}