import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Wrench, Link2 } from "lucide-react";

function Pill({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        ok
          ? "bg-[#54D9AE]/15 text-[#54D9AE] border-[#54D9AE]/40"
          : "bg-red-500/10 text-red-300 border-red-400/40"
      }`}
    >
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {label}
    </span>
  );
}

function Row({ label, ok, detail }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-t border-white/5 py-3 first:border-t-0">
      <div className="sm:w-52 shrink-0 text-sm font-bold text-white">{label}</div>
      <div className="shrink-0">{ok === null ? <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Skipped</span> : <Pill ok={ok} label={ok ? "Pass" : "Fail"} />}</div>
      <div className="text-xs text-slate-400 leading-relaxed break-words">{detail}</div>
    </div>
  );
}

// Loads the public homepage in a hidden same-origin iframe, lets React render,
// then reads the metadata a search engine would see after rendering.
function inspectRenderedPage() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;left:-9999px";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      let out = { loaded: false };
      try {
        const doc = iframe.contentDocument;
        const metaDesc = doc.querySelector('meta[name="description"]')?.content || null;
        const jsonLds = [...doc.querySelectorAll('script[type="application/ld+json"]')];
        const schemas = [];
        let jsonValid = jsonLds.length > 0;
        jsonLds.forEach((s) => {
          try {
            const d = JSON.parse(s.textContent);
            const types = d["@graph"] ? d["@graph"].map((n) => n["@type"]) : [d["@type"]];
            types.forEach((t) => (Array.isArray(t) ? schemas.push(...t) : schemas.push(t)));
          } catch {
            jsonValid = false;
          }
        });
        out = {
          loaded: true,
          title: doc.title || null,
          description: metaDesc,
          canonical: doc.querySelector('link[rel="canonical"]')?.href || null,
          robots: doc.querySelector('meta[name="robots"]')?.content || null,
          ogTitle: doc.querySelector('meta[property="og:title"]')?.content || null,
          ogDescription: doc.querySelector('meta[property="og:description"]')?.content || null,
          viewport: doc.querySelector('meta[name="viewport"]')?.content || null,
          schemaTypes: [...new Set(schemas.filter(Boolean))],
          jsonValid,
          schemaCount: jsonLds.length,
        };
      } catch {}
      iframe.remove();
      resolve(out);
    };
    iframe.onload = () => setTimeout(finish, 3000);
    setTimeout(finish, 9000); // safety net if the load event never fires
    iframe.src = "/";
    document.body.appendChild(iframe);
  });
}

export default function TechSeoPanel() {
  const [busy, setBusy] = useState(true);
  const [checks, setChecks] = useState(null);
  const [sweepBusy, setSweepBusy] = useState(false);
  const [sweep, setSweep] = useState(null);

  const run = async () => {
    setBusy(true);
    const results = {};
    try {
      const r = await fetch("/robots.txt");
      const t = await r.text();
      results.robots = { status: r.status, hasSitemap: /Sitemap:\s*\S+/.test(t), blocksPrivate: /Disallow:\s*\/admin/.test(t) };
    } catch {
      results.robots = null;
    }
    try {
      const r = await fetch("/sitemap.xml");
      const t = await r.text();
      results.sitemap = {
        status: r.status,
        urls: (t.match(/<loc>/g) || []).length,
        lastmods: (t.match(/<lastmod>/g) || []).length,
        locs: [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
      };
    } catch {
      results.sitemap = null;
    }
    results.render = await inspectRenderedPage();
    setChecks(results);
    setBusy(false);
  };

  const runSweep = async () => {
    if (!checks?.sitemap?.locs?.length) return;
    setSweepBusy(true);
    const results = await Promise.all(
      checks.sitemap.locs.map(async (url) => {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
          return { url, status: r.status };
        } catch {
          return { url, status: 0 };
        }
      })
    );
    const broken = results.filter((r) => r.status < 200 || r.status >= 400);
    setSweep({ checked: results.length, broken });
    setSweepBusy(false);
  };

  const r = checks?.render;
  const metaPresent = r
    ? [r.title, r.description, r.canonical, r.ogTitle, r.ogDescription, r.viewport].filter(Boolean).length
    : 0;

  return (
    <div className="mt-8 holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#54D9AE]" /> Technical SEO checks
        </h2>
        <button
          onClick={run}
          disabled={busy}
          className="self-start inline-flex items-center gap-2 rounded-full border border-[#54D9AE]/40 text-[#54D9AE] font-bold px-4 py-2 text-sm hover:bg-[#54D9AE]/10 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Re-run checks
        </button>
      </div>

      {busy && !checks ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-[#54D9AE] animate-spin" />
        </div>
      ) : (
        <div className="mt-4">
          <Row
            label="robots.txt"
            ok={checks?.robots ? checks.robots.status === 200 && checks.robots.hasSitemap && checks.robots.blocksPrivate : false}
            detail={checks?.robots ? `HTTP ${checks.robots.status} · Sitemap reference ${checks.robots.hasSitemap ? "present" : "MISSING"} · private routes blocked ${checks.robots.blocksPrivate ? "yes" : "no"}` : "Could not fetch robots.txt"}
          />
          <Row
            label="sitemap.xml"
            ok={checks?.sitemap ? checks.sitemap.status === 200 && checks.sitemap.urls > 0 : false}
            detail={checks?.sitemap ? `HTTP ${checks.sitemap.status} · ${checks.sitemap.urls} URLs · ${checks.sitemap.lastmods} last-modified dates` : "Could not fetch sitemap.xml"}
          />
          <Row
            label="Canonical URL"
            ok={!!r?.canonical}
            detail={r?.canonical ? `Rendered page points to ${r.canonical}` : "No canonical tag found on the rendered homepage"}
          />
          <Row
            label="Metadata completeness"
            ok={metaPresent === 6}
            detail={r ? `${metaPresent}/6 on the rendered homepage: title, description, canonical, Open Graph title + description, mobile viewport${r.robots ? ` · robots meta: "${r.robots}"` : ""}` : "Homepage render check failed"}
          />
          <Row
            label="Structured data"
            ok={!!r?.jsonValid}
            detail={r?.jsonValid ? `${r.schemaCount} JSON-LD block(s), valid JSON · schema types: ${r.schemaTypes.join(", ") || "none"}` : "No valid JSON-LD found on the rendered homepage"}
          />
          <Row
            label="Mobile viewport"
            ok={!!r?.viewport}
            detail={r?.viewport ? `Viewport meta present: "${r.viewport}"` : "No viewport meta found"}
          />
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={runSweep}
              disabled={sweepBusy || !checks?.sitemap?.locs?.length}
              className="inline-flex items-center gap-2 rounded-full border border-[#54D9AE]/40 text-[#54D9AE] font-bold px-4 py-2 text-sm hover:bg-[#54D9AE]/10 transition-colors disabled:opacity-50"
            >
              {sweepBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Check all sitemap URLs for errors
            </button>
            {sweep && (
              <span className="text-xs text-slate-400">
                {sweep.checked} URLs checked ·{" "}
                {sweep.broken.length === 0 ? (
                  <span className="text-[#54D9AE] font-semibold">no broken pages found</span>
                ) : (
                  <span className="text-red-300 font-semibold">{sweep.broken.length} with errors: {sweep.broken.map((b) => `${b.url} (${b.status || "network error"})`).join(", ")}</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}