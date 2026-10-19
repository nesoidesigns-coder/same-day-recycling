import { useState, useEffect } from "react";
import { Loader2, Lightbulb, ChevronDown, Trash2, MessageCircle, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AnalysisDisplayer() {
  const [analyses, setAnalyses] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    try {
      const { items } = await base44.entities.ResearchResult.filter({}, { sort: "-created_date", limit: 30 });
      setAnalyses(items);
    } catch {
      setAnalyses([]);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await base44.entities.ResearchResult.delete(id);
    load();
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-[#1d9e56]" /> AI analyses
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Every AI research report the site runs — competitor analysis, market research and receptionist lookups — saved and displayed here.
      </p>

      {analyses === null && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" />
        </div>
      )}
      {analyses !== null && analyses.length === 0 && (
        <p className="text-sm text-slate-500">No analyses yet.</p>
      )}
      {analyses !== null && analyses.length > 0 && (
        <div className="flex flex-col gap-2">
          {analyses.map((r) => {
            const open = expandedId === r.id;
            return (
              <div key={r.id} className="rounded-xl bg-[#f4f7f5] p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setExpandedId(open ? null : r.id)} className="min-w-0 text-left flex-1">
                    <p className="font-semibold text-[#0c3b24] text-sm">{r.topic}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      {r.origin === "receptionist" && <MessageCircle className="w-3 h-3" />}
                      {r.origin === "receptionist" ? "From AI receptionist" : "From research tool"}
                      &nbsp;· {new Date(r.created_date).toLocaleDateString()}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(open ? null : r.id)}
                      className="p-2 text-slate-500 hover:text-[#1d9e56] transition-colors"
                      aria-label="Toggle analysis"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      aria-label="Delete analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-3 text-sm">
                    <p className="text-slate-700">{r.summary}</p>
                    {r.key_takeaways?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Key takeaways</h4>
                        <ul className="flex flex-col gap-1">
                          {r.key_takeaways.map((t, i) => (
                            <li key={i} className="text-slate-600 flex gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#1d9e56] shrink-0 mt-0.5" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.opportunities?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Opportunities</h4>
                        <ul className="list-disc pl-5 text-slate-600 flex flex-col gap-1">
                          {r.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.sources?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Sources</h4>
                        <ul className="list-disc pl-5 text-xs text-slate-500 flex flex-col gap-1 break-words">
                          {r.sources.map((s, i) => <li key={i} className="break-words">{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}