import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, Globe2, MessagesSquare, Loader2, RefreshCw, CheckCircle2, XCircle,
  Sparkles, ClipboardCheck, History, TriangleAlert, LineChart as LineChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

// SEO Action Engine: audits tracked pages, shows the three intelligence layers
// separately (verified GSC / estimated demand / public discussions), queues Rex
// recommendations for admin approval, records every applied change, and tracks
// performance over time.
export default function AdminSeoAction() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");
  const [audits, setAudits] = useState(null);
  const [chartPage, setChartPage] = useState("/junk-removal-vancouver");

  const overview = useQuery({
    queryKey: ["seoActionOverview"],
    queryFn: async () => (await base44.functions.invoke("seoActionEngine", { action: "overview" })).data,
  });

  // Intelligence layer 2: external demand ESTIMATES (provider data, not verified).
  const demand = useQuery({
    queryKey: ["seoActionDemand"],
    queryFn: async () => (await base44.entities.DemandObservation.filter({ est_monthly_volume: { $gt: 0 } }, { sort: "-est_monthly_volume", limit: 10 })).items || [],
  });

  // Intelligence layer 3: public service-request discussions.
  const discussions = useQuery({
    queryKey: ["seoActionDiscussions"],
    queryFn: async () => {
      const res = await base44.entities.PublicOpportunity.aggregate({ query: { status: "open" }, groupBy: "service_category" });
      return res?.rows || [];
    },
  });

  const run = async (action, extra = {}) => {
    setBusy(action + (extra.id || ""));
    setFeedback("");
    try {
      const res = (await base44.functions.invoke("seoActionEngine", { action, ...extra })).data;
      if (action === "audit") setAudits(res.audits || []);
      else if (action === "recommend") setFeedback(res.skipped && res.reason ? res.reason : `${res.created || 0} recommendation(s) queued for review.`);
      else if (action === "snapshot") setFeedback(`Snapshot saved for ${res.created} page(s).`);
      else if (action === "approve") setFeedback(res.applied === "content_direction" ? "Content direction approved and recorded — the section itself is implemented in page copy." : "Metadata change applied and logged in the change history.");
      else if (action === "decline") setFeedback("Recommendation declined.");
      qc.invalidateQueries({ queryKey: ["seoActionOverview"] });
    } catch (e) {
      setFeedback(e?.response?.data?.error || e?.message || "The action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const data = overview.data || {};
  const pending = (data.recommendations || []).filter((r) => r.status === "pending_review");
  const latest = {};
  for (const s of data.snapshots || []) if (!latest[s.page_path]) latest[s.page_path] = s;
  const chartRows = (data.snapshots || [])
    .filter((s) => s.page_path === chartPage)
    .sort((a, b) => String(a.snapshot_date).localeCompare(String(b.snapshot_date)))
    .map((s) => ({ date: s.snapshot_date, clicks: s.clicks, impressions: s.impressions, position: s.avg_position }));

  if (overview.isLoading) {
    return <div className="flex items-center justify-center py-24 text-slate-500"><Loader2 className="w-6 h-6 animate-spin text-[#187B65]" /> Loading the SEO Action Engine…</div>;
  }
  if (overview.isError) {
    return <p className="flex items-center gap-2 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> The SEO Action Engine could not be loaded.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header + engine actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><Search className="w-6 h-6 text-[#187B65]" /> SEO Action Engine</h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Measures real search performance, identifies opportunities from three separated intelligence layers, and lets Rex propose improvements — every substantial change waits for your approval before it touches a public page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("audit")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors disabled:opacity-50">
            {busy === "audit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />} Audit pages
          </button>
          <button onClick={() => run("recommend")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a3020] transition-colors disabled:opacity-50">
            {busy === "recommend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate recommendations
          </button>
          <button onClick={() => run("snapshot")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors disabled:opacity-50">
            {busy === "snapshot" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Snapshot performance
          </button>
        </div>
      </div>
      {feedback && <p className="rounded-2xl border border-[#187B65]/25 bg-[#f4f7f5] px-4 py-3 text-sm font-semibold text-[#102B2A]" role="status">{feedback}</p>}

      {/* Three separated intelligence layers */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><LineChartIcon className="w-4 h-4 text-[#187B65]" /> Verified Search Console</h2>
          <p className="mt-1 text-[11px] text-slate-500">Google Search Console data — clicks, impressions, average position (28-day window).</p>
          <div className="mt-3 space-y-2">
            {(data.pages || []).map((p) => {
              const s = latest[p.path];
              return (
                <button key={p.path} onClick={() => setChartPage(p.path)} className={`block w-full rounded-xl border p-3 text-left transition-colors ${chartPage === p.path ? "border-[#187B65] bg-[#f4f7f5]" : "border-slate-100 hover:border-[#187B65]/40"}`}>
                  <p className="text-xs font-bold text-[#102B2A]">{p.label}</p>
                  <p className="font-mono text-[10px] text-slate-400">{p.path}</p>
                  {s ? (
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      <span className="font-bold text-[#102B2A]">{s.clicks}</span> clicks · <span className="font-bold text-[#102B2A]">{s.impressions}</span> impressions · pos <span className="font-bold text-[#102B2A]">{s.avg_position || "—"}</span>
                      <span className="block text-[10px] text-slate-400">{s.snapshot_date} · {s.bookings || 0} booking(s) {s.booking_basis === "city" ? "in city" : "site-wide"}</span>
                    </p>
                  ) : <p className="mt-1 text-[11px] text-slate-400">No snapshot yet — run one.</p>}
                </button>
              );
            })}
          </div>
          {chartRows.length > 1 && (
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="clicks" stroke="#187B65" strokeWidth={2} dot={false} name="Clicks" />
                  <Line type="monotone" dataKey="impressions" stroke="#94a3b8" strokeWidth={1.5} dot={false} name="Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Globe2 className="w-4 h-4 text-amber-600" /> Estimated market demand</h2>
          <p className="mt-1 text-[11px] text-slate-500">External provider estimates — directional only, never presented as verified performance.</p>
          <ul className="mt-3 space-y-2">
            {(demand.data || []).map((d, i) => (
              <li key={i} className="text-xs border-b border-slate-50 pb-2 last:border-0">
                <span className="font-bold text-[#102B2A]">{d.keyword}</span>
                <span className="block text-slate-500 tabular-nums">~{Number(d.est_monthly_volume).toLocaleString("en-CA")}/mo est. · {d.provider || "manual"} · {d.province_code || d.geo_key || "CA"} · {d.period || "period n/a"}</span>
              </li>
            ))}
            {!(demand.data || []).length && <li className="text-[11px] text-slate-400">No demand observations stored yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><MessagesSquare className="w-4 h-4 text-[#187B65]" /> Public service-request discussions</h2>
          <p className="mt-1 text-[11px] text-slate-500">Open public posts from the discovery feed — a demand signal, not a lead count.</p>
          <ul className="mt-3 space-y-2">
            {(discussions.data || []).slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs border-b border-slate-50 pb-2 last:border-0">
                <span className="text-[#102B2A] font-semibold">{(r.service_category || "other").replace(/_/g, " ")}</span>
                <span className="font-bold tabular-nums text-[#102B2A]">{r.count}</span>
              </li>
            ))}
            {!(discussions.data || []).length && <li className="text-[11px] text-slate-400">No open public discussions indexed yet.</li>}
          </ul>
          <Link to="/admin/discovery" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#187B65] hover:underline">Open discovery <RefreshCw className="w-3 h-3" /></Link>
        </div>
      </div>

      {/* Audit results */}
      {audits && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-[#187B65]" /> Page audits</h2>
          {audits.map((a) => (
            <div key={a.page_path} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold text-[#102B2A]">{a.page_label} <span className="font-mono text-[10px] text-slate-400">{a.page_path}</span></h3>
                <a href={a.canonical} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#187B65] hover:underline">Canonical: {a.canonical}</a>
              </div>
              <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-[#f4f7f5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Meta title ({a.meta.title_length} chars · {a.meta.source})</p>
                  <p className="mt-1 text-[#102B2A] font-semibold">{a.meta.title || "— none stored —"}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Meta description ({a.meta.description_length} chars)</p>
                  <p className="mt-1 text-slate-600">{a.meta.description || "— none stored —"}</p>
                </div>
                <div className="rounded-xl bg-[#f4f7f5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search Console ({a.gsc.window?.startDate} → {a.gsc.window?.endDate})</p>
                  <p className="mt-1 text-[#102B2A] font-semibold tabular-nums">{a.gsc.clicks} clicks · {a.gsc.impressions} impressions · pos {a.gsc.position} · CTR {a.gsc.ctr}%</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Top queries</p>
                  <ul className="mt-1 space-y-0.5">
                    {a.top_queries.slice(0, 6).map((q, i) => (
                      <li key={i} className="flex justify-between gap-2 text-slate-600 tabular-nums"><span className="truncate">{q.query}</span><span className="shrink-0">{q.clicks}c · {q.impressions}i · p{q.position}</span></li>
                    ))}
                    {!a.top_queries.length && <li className="text-slate-400">No query rows for this page yet.</li>}
                  </ul>
                </div>
              </div>
              {a.notes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {a.notes.map((n, i) => <li key={i} className="text-[11px] text-amber-800"><TriangleAlert className="inline w-3 h-3 mr-1" />{n}</li>)}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-slate-400">{a.headings.length} indexed headings on page · target keywords: {a.target_keywords.join(", ")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation queue — nothing publishes without approval */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#187B65]" /> Rex recommendations ({pending.length} awaiting review)</h2>
        <p className="mt-1 text-[11px] text-slate-500">Metadata approvals apply instantly and are logged. Content approvals record the direction — the section is implemented in page copy.</p>
        <div className="mt-3 space-y-3">
          {pending.map((r) => (
            <RecCard key={r.id} rec={r} busy={busy} onApprove={run} onDecline={run} />
          ))}
          {!pending.length && <p className="text-xs text-slate-500 py-3">No recommendations awaiting review. Generate some, or the weekly workflow will queue them for you.</p>}
        </div>
      </div>

      {/* Change history */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><History className="w-4 h-4 text-[#187B65]" /> SEO change history</h2>
          <p className="mt-1 text-[11px] text-slate-500">Every applied metadata change with its before/after Search Console baseline. After-values fill in from the first snapshot taken post-change.</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#f4f7f5] text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="text-left px-4 py-2.5">Date</th><th className="text-left px-4 py-2.5">Page</th><th className="text-left px-4 py-2.5">Keyword</th><th className="text-left px-4 py-2.5">Title change</th><th className="text-left px-4 py-2.5">GSC before → after</th><th className="text-left px-4 py-2.5 hidden lg:table-cell">Reason</th></tr>
            </thead>
            <tbody>
              {(data.changes || []).map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-[#102B2A]">{c.change_date}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{c.page_path}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.target_keyword}</td>
                  <td className="px-4 py-2.5 max-w-[220px]"><span className="text-slate-400 line-clamp-1">{c.previous_title || "—"}</span><span className="text-[#102B2A] line-clamp-1">→ {c.new_title}</span></td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">
                    {c.gsc_before_clicks}c · {c.gsc_before_impressions}i · p{c.gsc_before_position}
                    <span className="block">{c.gsc_after_measured ? `${c.gsc_after_clicks}c · ${c.gsc_after_impressions}i · p${c.gsc_after_position}` : "after not yet measured"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell max-w-[240px] line-clamp-2">{c.reason}</td>
                </tr>
              ))}
              {!(data.changes || []).length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No changes recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applied / declined log */}
      {(data.recommendations || []).filter((r) => r.status !== "pending_review").length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#187B65]" /> Decision log</h2>
          <ul className="mt-2 space-y-1.5">
            {(data.recommendations || []).filter((r) => r.status !== "pending_review").slice(0, 12).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-2 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-bold uppercase ${r.status === "applied" ? "bg-[#187B65]/10 text-[#187B65]" : "bg-red-50 text-red-700"}`}>{r.status}</span>
                <span className="font-mono text-slate-400">{r.page_path}</span>
                <span className="font-semibold text-[#102B2A]">{r.target_keyword}</span>
                {r.review_note && <span className="text-slate-500">{r.review_note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecCard({ rec, busy, onApprove, onDecline }) {
  const [note, setNote] = useState("");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rec.kind === "metadata" ? "bg-[#187B65]/10 text-[#187B65]" : "bg-amber-100 text-amber-800"}`}>{rec.kind}</span>
        <span className="font-mono text-[10px] text-slate-400">{rec.page_path}</span>
        <span className="text-xs font-bold text-[#102B2A]">Target: {rec.target_keyword}</span>
      </div>
      {rec.kind === "metadata" ? (
        <div className="mt-2 text-xs">
          <p><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New title</span> <span className="font-semibold text-[#102B2A]">{rec.proposed_title}</span></p>
          <p className="mt-1 text-slate-600">{rec.proposed_description}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-600">{rec.proposed_content_note}</p>
      )}
      {rec.rationale && <p className="mt-2 text-[11px] text-slate-500"><span className="font-bold">Why:</span> {rec.rationale}</p>}
      {rec.gsc_context && <p className="mt-1 text-[11px] text-slate-400">{rec.gsc_context}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional review note" className="input py-2 text-xs flex-1 min-w-[180px]" />
        <button onClick={() => onApprove("approve", { id: rec.id, review_note: note })} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-50">
          {busy === "approve" + rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve {rec.kind === "metadata" ? "& apply" : "direction"}
        </button>
        <button onClick={() => onDecline("decline", { id: rec.id, review_note: note })} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50">
          <XCircle className="w-3.5 h-3.5" /> Decline
        </button>
      </div>
    </div>
  );
}