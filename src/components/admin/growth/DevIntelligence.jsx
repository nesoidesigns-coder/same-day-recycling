import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock,
  Minus, Play, Sparkles, Target, TrendingDown, TrendingUp,
} from "lucide-react";
import AuditImportForm from "@/components/admin/growth/AuditImportForm";

// Development Intelligence: every verified website performance audit on
// record, what changed, what was tested, what improved or regressed, and what
// should happen next. Independently observed results are clearly labelled —
// they are historical evidence, never live measurements.
const TARGETS = [
  { metric: "seo", label: "SEO", target: "Maintain 100", met: (v) => v >= 100 },
  { metric: "accessibility", label: "Accessibility", target: "95+", met: (v) => v >= 95 },
  { metric: "best_practices", label: "Best Practices", target: "95+", met: (v) => v >= 95 },
  { metric: "performance", label: "Lighthouse Performance", target: "90+", met: (v) => v >= 90 },
  { metric: "tbt_ms", label: "Total Blocking Time", target: "Under 200 ms", met: (v) => v != null && v < 200 },
  { metric: "lcp_seconds", label: "Largest Contentful Paint", target: "Under 2.5 s", met: (v) => v != null && v < 2.5 },
  { metric: "cls", label: "Cumulative Layout Shift", target: "Under 0.1", met: (v) => v != null && v < 0.1 },
];

const SOURCE_LABEL = {
  independent_debugbear: "DebugBear · independent",
  pagespeed_insights: "PageSpeed Insights · authorized",
  admin_imported: "Imported report",
};

const seconds = (s) => { const m = String(s || "").match(/([\d.]+)\s*s/); return m ? Number(m[1]) : null; };
const ms = (s) => { const m = String(s || "").match(/([\d.]+)\s*ms/); return m ? Number(m[1]) : null; };
const clsOf = (s) => { const m = String(s || "").match(/([\d.]+)/); return m ? Number(m[1]) : null; };

const scoreChip = (label, value) => (
  <div key={label} className="rounded-xl bg-[#f4f7f5] px-3 py-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-lg font-extrabold text-[#102B2A] tabular-nums">{value == null ? "—" : value}</div>
  </div>
);

const trendIcon = (dir) =>
  dir === "improved" ? <TrendingUp className="w-3.5 h-3.5 text-[#187B65]" />
  : dir === "regressed" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
  : <Minus className="w-3.5 h-3.5 text-slate-400" />;

export default function DevIntelligence() {
  const [audits, setAudits] = useState(null);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const a = await base44.entities.PerformanceAudit.filter({}, { sort: "-test_date", limit: 100 });
      const c = await base44.entities.Improvement.filter({}, { sort: "-created_date", limit: 50 });
      setAudits(a.items || a || []);
      setChanges(c.items || c || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Chronology first: verified execution timestamp, then owner-verified
  // same-day execution order — never import order or the test's label.
  const chronDesc = (a, b) =>
    String(b.test_date).localeCompare(String(a.test_date)) ||
    String(b.tested_at || "").localeCompare(String(a.tested_at || "")) ||
    (b.execution_sequence ?? 0) - (a.execution_sequence ?? 0) ||
    String(b.created_date || "").localeCompare(String(a.created_date || ""));
  const list = [...(audits || [])].sort(chronDesc);
  const latest = list[0] || null;
  // Previous comparable: same URL, device and same tool, earlier in chronology.
  const previous = latest ? list.find((a) => a.id !== latest.id && a.tested_url === latest.tested_url && a.strategy === latest.strategy && a.test_source === latest.test_source) || null : null;

  const cmp = (key, invert) => {
    if (!latest || !previous || latest[key] == null || previous[key] == null || latest[key] === previous[key]) return null;
    const better = invert ? latest[key] < previous[key] : latest[key] > previous[key];
    return { delta: latest[key] - previous[key], better };
  };
  const aiCmp = latest && previous && latest.ai_score_max === previous.ai_score_max && latest.ai_score != null && previous.ai_score != null && latest.ai_score !== previous.ai_score
    ? { delta: latest.ai_score - previous.ai_score, better: latest.ai_score > previous.ai_score } : null;

  const timeline = [
    ...list.map((a) => ({
      date: a.test_date, type: "audit",
      title: a.run_label || SOURCE_LABEL[a.test_source] || "Performance audit",
      detail: `${a.strategy} · ${SOURCE_LABEL[a.test_source] || a.test_source} · perf ${a.performance ?? "—"}/a11y ${a.accessibility ?? "—"}/SEO ${a.seo ?? "—"}${a.notes ? ` · ${a.notes}` : ""}`,
    })),
    ...changes.map((c) => ({
      date: String(c.created_date || "").slice(0, 10), type: "change",
      title: c.title,
      detail: `Improvement queue · ${String(c.status || "").replace("_", " ")}${c.before_result ? ` · before: ${c.before_result.slice(0, 90)}` : ""}${c.after_result ? ` · after: ${c.after_result.slice(0, 90)}` : ""}`,
    })),
  ].filter((e) => e.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);

  const runLiveAudit = async () => {
    setRunning(true); setNotice(""); setError("");
    try {
      const res = await base44.functions.invoke("pageSpeedAudit", { url: "https://samedayrecycling.ca/" });
      const results = (res.data?.results || []).filter((r) => r.performance != null);
      if (!results.length) throw new Error("The PageSpeed test did not complete — nothing recorded.");
      const today = new Date().toISOString().slice(0, 10);
      for (const r of results) {
        await base44.functions.invoke("performanceIntelligence", {
          action: "import",
          audit: {
            test_date: today,
            run_label: `PSI ${r.strategy} live run`,
            test_source: "pagespeed_insights",
            strategy: r.strategy,
            observation_type: "measured_run",
            tested_url: res.data.url || "https://samedayrecycling.ca/",
            performance: r.performance, accessibility: r.accessibility, seo: r.seo,
            lcp_seconds: seconds(r.lcp), tbt_ms: ms(r.tbt), cls: clsOf(r.cls),
            fcp_seconds: seconds(r.fcp), speed_index_seconds: seconds(r.si),
            notes: `Authorized live PageSpeed Insights run (mobile + desktop). Deployment freshness at test time was not separately verified. LCP ${r.lcp}, TBT ${r.tbt}, CLS ${r.cls}.`,
          },
        });
      }
      setNotice("Live PageSpeed run recorded — see the audit history below.");
      await load();
    } catch (e) {
      setError(e.message || "Live audit failed.");
    }
    setRunning(false);
  };

  const analyze = async () => {
    setAnalyzing(true); setError("");
    try {
      const res = await base44.functions.invoke("performanceIntelligence", { action: "analyze" });
      setAnalysis(res.data?.analysis || null);
      setNotice("AI Business Master analyzed the verified history and stored its summary in Business Memory.");
    } catch (e) {
      setError(e.message || "Analysis failed.");
    }
    setAnalyzing(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#102B2A] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#187B65]" /> Development Intelligence
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            What was changed → what was tested → what improved → what regressed → what should happen next.
            Independently observed results are historical evidence, never live values. Targets are goals, not guaranteed outcomes.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={runLiveAudit} disabled={running || loading}
            className="rounded-full bg-[#187B65] text-white font-bold px-4 py-2.5 text-xs hover:bg-[#125c4c] transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {running ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Testing…" : "Run live PageSpeed audit"}
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className="rounded-full bg-white border border-slate-200 font-bold px-4 py-2.5 text-xs text-[#102B2A] hover:border-[#187B65] transition-colors">
            {showImport ? "Hide import form" : "Import verified report"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-xs text-[#187B65] font-semibold">{notice}</p>}

      {loading ? (
        <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-8 text-center text-sm text-slate-500">Loading audit history…</div>
      ) : list.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-8 text-center text-sm text-slate-500">
          No verified audits recorded yet. Run a live PageSpeed audit or import an independently observed report.
        </div>
      ) : (
        <>
          {/* Latest + previous comparable */}
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {[latest && { label: "Latest verified audit", a: latest }, previous && { label: "Previous comparable audit", a: previous }].filter(Boolean).map(({ label, a }) => (
              <div key={label} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65]">{label}</div>
                  <div className="text-[10px] text-slate-400 tabular-nums">{a.test_date}</div>
                </div>
                <div className="text-sm font-bold text-[#102B2A] mt-2">{a.run_label || SOURCE_LABEL[a.test_source]}</div>
                <div className="text-[11px] text-slate-500">
                  {SOURCE_LABEL[a.test_source] || a.test_source} · {a.strategy} · {a.observation_type === "independent_observed" ? "independently observed (imported · historical, not live)" : "measured run"}
                </div>
                <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                  {scoreChip("Perf", a.performance)}{scoreChip("A11y", a.accessibility)}{scoreChip("SEO", a.seo)}
                  {scoreChip("Best Pr.", a.best_practices)}
                  {scoreChip("AI", a.ai_score_max ? `${a.ai_score}/${a.ai_score_max}` : null)}
                  {scoreChip("LCP", a.lcp_seconds != null ? `${a.lcp_seconds}s` : null)}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {scoreChip("TBT", a.tbt_ms != null ? `${a.tbt_ms}ms` : null)}
                  {scoreChip("CLS", a.cls ?? null)}
                  {scoreChip("FCP", a.fcp_seconds != null ? `${a.fcp_seconds}s` : null)}
                </div>
                {a.notes && <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{a.notes}</p>}
                {a.deployment_context && <p className="mt-1 text-[11px] text-slate-400">Deployment: {a.deployment_context}</p>}
              </div>
            ))}
          </div>

          {/* Trend summary */}
          <div className="mt-4 rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">Performance trend · latest vs previous comparable (verified chronology)</div>
            {previous ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                {[["Performance", cmp("performance")], ["Accessibility", cmp("accessibility")], ["SEO", cmp("seo")], ["Best Practices", cmp("best_practices")], ["AI assessment", aiCmp]].map(([label, t]) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl bg-[#f4f7f5] px-3 py-2">
                    {t ? trendIcon(t.better ? "improved" : "regressed") : <Minus className="w-3.5 h-3.5 text-slate-400" />}
                    <div>
                      <div className="font-bold text-[#102B2A]">{label}</div>
                      <div className="text-[10px] text-slate-500">{t ? `${t.delta > 0 ? "+" : ""}${Math.round(t.delta * 100) / 100} ${t.better ? "improved" : "regressed"}` : "No change / no comparable data"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No earlier comparable test (same URL and device) on record — a trend needs at least two comparable tests.</p>
            )}
          </div>

          {/* Trends within each tool: every comparable pair, imported pairs included */}
          {(() => {
            const groups = new Map();
            list.forEach((a) => {
              const key = `${a.tested_url}|${a.strategy}|${a.test_source}`;
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key).push(a);
            });
            const pairs = [...groups.values()].filter((g) => g.length >= 2).map((g) => ({ latest: g[0], previous: g[1] }));
            if (!pairs.length) return null;
            const deltaOf = (l, p, key) => {
              if (l[key] == null || p[key] == null || l[key] === p[key]) return null;
              const delta = l[key] - p[key];
              return { delta, better: key === "tbt_ms" || key === "lcp_seconds" ? delta < 0 : delta > 0 };
            };
            const aiDelta = (l, p) => {
              if (l.ai_score == null || p.ai_score == null || l.ai_score_max !== p.ai_score_max || l.ai_score === p.ai_score) return null;
              return { delta: l.ai_score - p.ai_score, better: l.ai_score > p.ai_score };
            };
            return (
              <div className="mt-4 rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">Trends within each tool · latest vs previous comparable</div>
                <div className="space-y-3">
                  {pairs.map(({ latest: l, previous: p }) => (
                    <div key={`${p.id}-${l.id}`} className="rounded-xl bg-[#f4f7f5] px-3 py-2.5">
                      <div className="text-[11px] font-bold text-[#102B2A]">
                        {l.run_label || SOURCE_LABEL[l.test_source] || "Latest"} <span className="font-semibold text-slate-400">vs</span> {p.run_label || SOURCE_LABEL[p.test_source] || "previous"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {SOURCE_LABEL[l.test_source] || l.test_source} · {l.strategy} · {l.test_date} vs {p.test_date}
                        {l.observation_type === "independent_observed" ? " · imported, historical (not live)" : ""}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-[#102B2A]">
                        {[["accessibility", deltaOf(l, p, "accessibility")], ["AI assessment", aiDelta(l, p)], ["performance", deltaOf(l, p, "performance")], ["SEO", deltaOf(l, p, "seo")], ["Best Practices", deltaOf(l, p, "best_practices")]].map(([label, t]) => (
                          t ? (
                            <span key={label} className="inline-flex items-center gap-1">
                              {trendIcon(t.better ? "improved" : "regressed")} {label} {t.delta > 0 ? "+" : ""}{t.delta}
                              {label === "AI assessment" ? ` (${p.ai_score}→${l.ai_score}/${l.ai_score_max})` : ""}
                            </span>
                          ) : null
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Targets */}
          <div className="mt-4 rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Optimization targets · goals, not guaranteed outcomes
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2 pr-4 font-bold">Metric</th>
                    <th className="py-2 pr-4 font-bold">Target</th>
                    <th className="py-2 pr-4 font-bold">Latest comparable</th>
                    <th className="py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TARGETS.map((t) => {
                    const val = latest ? latest[t.metric] : null;
                    const status = val == null ? "no-data" : t.met(val) ? "met" : "missed";
                    return (
                      <tr key={t.metric}>
                        <td className="py-2 pr-4 font-semibold text-[#102B2A]">{t.label}</td>
                        <td className="py-2 pr-4 text-slate-500 tabular-nums">{t.target}</td>
                        <td className="py-2 pr-4 text-slate-700 tabular-nums">{val == null ? "—" : val}</td>
                        <td className="py-2">
                          {status === "met" ? <span className="inline-flex items-center gap-1 text-[#187B65] font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> On target</span>
                          : status === "missed" ? <span className="inline-flex items-center gap-1 text-amber-600 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Below target</span>
                          : <span className="inline-flex items-center gap-1 text-slate-400 font-bold"><Clock className="w-3.5 h-3.5" /> Not reported by this tool</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Business Master analysis */}
          <div className="mt-4 rounded-3xl bg-[#102B2A] text-emerald-50 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#54D9AE] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Business Master · performance optimization
              </div>
              <button onClick={analyze} disabled={analyzing}
                className="rounded-full bg-[#54D9AE] text-[#102B2A] font-bold px-4 py-2 text-xs hover:bg-[#7ce8c6] transition-colors disabled:opacity-50">
                {analyzing ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze audit history"}
              </button>
            </div>
            {!analysis ? (
              <p className="text-xs text-emerald-100/70">Ask AI Business Master to identify bottlenecks, detect regressions between comparable tests, recommend lazy loading and code splitting where the data supports it, and evaluate mobile usability and booking responsiveness — with a hard rule that customer functionality (quotes, pricing, booking, Rex, contractor operations) is never sacrificed for a benchmark score.</p>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-emerald-50/90 leading-relaxed">{analysis.summary}</p>
                {analysis.bottlenecks?.length > 0 && (
                  <div>
                    <div className="font-bold text-[#54D9AE] uppercase tracking-wider text-[10px] mb-1">Bottlenecks (from measured data)</div>
                    <ul className="space-y-1 text-emerald-100/80">{analysis.bottlenecks.map((b, i) => <li key={i}>• {b}</li>)}</ul>
                  </div>
                )}
                {analysis.regressions?.length > 0 && (
                  <div>
                    <div className="font-bold text-amber-300 uppercase tracking-wider text-[10px] mb-1">Regressions detected</div>
                    <ul className="space-y-1 text-emerald-100/80">{analysis.regressions.map((b, i) => <li key={i}>• {b}</li>)}</ul>
                  </div>
                )}
                {analysis.recommendations?.length > 0 && (
                  <div>
                    <div className="font-bold text-[#54D9AE] uppercase tracking-wider text-[10px] mb-1">Prioritized improvements</div>
                    <ol className="space-y-1 text-emerald-100/80">
                      {analysis.recommendations.slice(0, 6).sort((a, b) => (a.priority || 9) - (b.priority || 9)).map((r, i) => (
                        <li key={i}>• <span className="font-bold text-white">{r.title}</span> — {r.rationale}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {analysis.mobile_usability && (
                  <div>
                    <div className="font-bold text-[#54D9AE] uppercase tracking-wider text-[10px] mb-1">Mobile usability & booking responsiveness</div>
                    <p className="text-emerald-100/80">{analysis.mobile_usability}</p>
                  </div>
                )}
                {analysis.next_improvement && (
                  <div className="rounded-xl bg-white/5 border border-[#187B65]/30 p-3">
                    <span className="font-bold text-[#54D9AE]">Recommended next improvement: </span>
                    {analysis.next_improvement}
                  </div>
                )}
                <p className="text-[10px] text-emerald-100/40">Summary stored in AI Business Master's Business Memory. Analysis derives only from recorded audits and the improvement queue.</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="mt-4 rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
            <button onClick={() => setShowTimeline(!showTimeline)} className="w-full flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#102B2A]">Development timeline ({timeline.length} events)</span>
              {showTimeline ? <ChevronUp className="w-4 h-4 text-[#187B65]" /> : <ChevronDown className="w-4 h-4 text-[#187B65]" />}
            </button>
            <p className="text-[11px] text-slate-500 mt-1">Audits (what was tested) and improvement-queue changes (what was modified) in chronological order. Where the deployment state behind a score change is unknown, no cause is stated.</p>
            {showTimeline && (
              <ol className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
                {timeline.map((e, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${e.type === "audit" ? "bg-[#187B65]" : "bg-amber-400"}`} />
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 tabular-nums">
                      {e.date} · {e.type === "audit" ? "Tested" : "Changed"}
                    </div>
                    <div className="text-xs font-bold text-[#102B2A] mt-0.5">{e.title}</div>
                    <div className="text-[11px] text-slate-500">{e.detail}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {showImport && (
        <div className="mt-4">
          <AuditImportForm onImported={() => { setNotice("Verified report recorded."); load(); }} />
        </div>
      )}
    </div>
  );
}