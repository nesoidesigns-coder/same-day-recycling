import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Globe, Upload, Loader2, CheckCircle2 } from "lucide-react";

// Sitemap & indexing card: shows sitemap size, verified Search Console
// properties, and submits the sitemap to Google in one click.
export default function SitemapIndexCard({ sitemap, sites }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await base44.functions.invoke("submitSitemap", {});
      setResult(res.data || null);
      if (res.data?.error) setError(res.data.error);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Submit failed");
    }
    setBusy(false);
  };

  const ownProps = (sites || []).filter((s) => s.includes("samedayrecycling"));

  return (
    <div className="holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-[#54D9AE]" /> Sitemap &amp; indexing</h2>
        <button
          onClick={submit}
          disabled={busy}
          className="self-start inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Submitting…" : "Submit sitemap to Google"}
        </button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-black/20 border border-white/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Local sitemap</div>
          <div className="mt-1 font-bold text-white">{sitemap?.ok ? `${sitemap.urls} URLs listed` : "Unavailable"}</div>
          <div className="mt-1 text-xs text-slate-400">https://samedayrecycling.ca/sitemap.xml</div>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Search Console properties</div>
          {ownProps.length ? (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-300">{ownProps.map((p) => <li key={p}>{p}</li>)}</ul>
          ) : (
            <div className="mt-1 text-xs text-slate-400">None visible in the connected account.</div>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {result?.results && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          {result.results.map((r) => (
            <span key={r.property} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${r.ok ? "border-[#54D9AE]/40 text-[#54D9AE]" : "border-red-400/40 text-red-300"}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {r.property} · HTTP {r.status}
            </span>
          ))}
          <span className="text-slate-500">Discovery then takes Google a few days to a few weeks.</span>
        </div>
      )}
    </div>
  );
}