import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ShieldCheck, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import ProgressRing from "@/components/admin/gauges/ProgressRing";
import StatCard from "@/components/admin/gauges/StatCard";
import GaugeCard from "@/components/admin/gauges/GaugeCard";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/recyclingTaxonomy";

const REASONS = { closed: "Closed", wrong_info: "Wrong info", wrong_materials: "Wrong materials", wrong_contact: "Wrong contact", duplicate: "Duplicate", other: "Other" };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });

export default function AdminDirectory() {
  const [providers, setProviders] = useState(null);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [p, r] = await Promise.all([
        base44.entities.Provider.filter({}, { sort: "-created_date", limit: 500 }),
        base44.entities.ListingReport.filter({}, { sort: "-created_date", limit: 200 }),
      ]);
      setProviders(p.items || p);
      setReports(r.items || r);
    } catch (e) {
      setError(e?.message || "Could not load directory data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateProvider = async (id, data) => {
    setSaving(true);
    try {
      await base44.entities.Provider.update(id, data);
      await load();
    } catch {}
    setSaving(false);
  };

  if (providers === null) {
    return (
      <div className="min-h-screen admin-console flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#187B65] animate-spin" /></div>
    );
  }

  const verified = providers.filter((p) => p.verification === "verified").length;
  const coveredCats = new Set(providers.flatMap((p) => p.accepted_categories || []));
  const catCoverage = Math.round((coveredCats.size / CATEGORIES.length) * 100);
  const openReports = reports.filter((r) => r.status === "new").length;
  const provinces = {};
  for (const p of providers) {
    const key = p.province || "Unspecified";
    provinces[key] = (provinces[key] || 0) + 1;
  }
  const topProvinces = Object.entries(provinces).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxProv = Math.max(1, ...topProvinces.map(([, v]) => v));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 mb-2"><ArrowLeft className="w-3.5 h-3.5" />Control Center</Link>
        <h1 className="text-3xl font-bold tracking-tight">National Directory Admin</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Verify listings, manage reports, and track coverage. Nothing is published as confirmed without verification.</p>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold mb-6">{error}</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <GaugeCard title="Verified listings" status="Verified" updated={`Updated ${today()}`}>
            <ProgressRing value={verified} target={providers.length || 1} display={`${verified}`} targetDisplay={`${providers.length} total`} label="Verified listings" />
          </GaugeCard>
          <GaugeCard title="Material-category coverage" status="Verified" updated={`Updated ${today()}`}
            tooltip="Share of the 11 service categories with at least one provider listing.">
            <ProgressRing value={coveredCats.size} target={CATEGORIES.length} display={`${catCoverage}%`} targetDisplay="11 categories" label="Category coverage" />
          </GaugeCard>
          <GaugeCard title="Geographic coverage" status="Verified" updated={`Updated ${today()}`}
            tooltip="Provider listings by province or territory (top 4 shown).">
            {topProvinces.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No provider listings collected yet</p>
            ) : (
              <ul className="space-y-2.5">
                {topProvinces.map(([prov, count]) => (
                  <li key={prov}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-600">{prov}</span><span className="font-bold text-slate-800">{count}</span></div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-cyan-500 transition-all duration-700 motion-reduce:transition-none" style={{ width: `${(count / maxProv) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </GaugeCard>
          <StatCard title="Open listing reports" value={openReports} sub={`${reports.length} total reports`} tone="amber" />
        </div>

        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" />Providers ({providers.length})</h2>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto mb-10">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-bold">Provider</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Verification</th>
                <th className="px-4 py-3 font-bold">Sponsored</th>
                <th className="px-4 py-3 font-bold">Last confirmed</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800"><Link to={`/provider/${p.id}`} className="hover:text-emerald-600">{p.name}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{[p.city, p.province].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{(p.provider_type || "").replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <select value={p.verification} onChange={(e) => updateProvider(p.id, { verification: e.target.value })} className="input !py-1.5 !px-2 text-xs w-32" aria-label={`Verification for ${p.name}`}>
                      <option value="unverified">Unverified</option>
                      <option value="verified">Verified</option>
                      <option value="reported">Reported</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={!!p.sponsored} onChange={(e) => updateProvider(p.id, { sponsored: e.target.checked })} aria-label={`Sponsored for ${p.name}`} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" value={p.last_confirmed_date || ""} onChange={(e) => updateProvider(p.id, { last_confirmed_date: e.target.value })} className="input !py-1.5 !px-2 text-xs w-36" aria-label={`Last confirmed for ${p.name}`} />
                  </td>
                </tr>
              ))}
              {providers.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-sm">No provider listings collected yet — run the directory sync to populate them.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Flag className="w-5 h-5 text-amber-500" />Listing reports ({reports.length})</h2>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-bold">Listing</th>
                <th className="px-4 py-3 font-bold">Reason</th>
                <th className="px-4 py-3 font-bold">Details</th>
                <th className="px-4 py-3 font-bold">Reporter</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{r.provider_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{REASONS[r.reason] || r.reason}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate">{r.details || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.reporter_email || "Anonymous"}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={async (e) => { setSaving(true); try { await base44.entities.ListingReport.update(r.id, { status: e.target.value }); await load(); } catch {} setSaving(false); }} className="input !py-1.5 !px-2 text-xs w-32" aria-label={`Status for report on ${r.provider_name}`}>
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="fixed">Fixed</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-sm">No listing reports filed yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {saving && <p className="text-xs text-slate-400 mt-3">Saving…</p>}
      </div>
      <Footer />
    </div>
  );
}