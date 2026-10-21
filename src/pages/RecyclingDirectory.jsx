import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, ShieldCheck, ShieldAlert, Flag, X, Clock, Globe, Truck, HandCoins } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { CATEGORIES, CATEGORY_LABELS, matchCategories, providerMatchesQuery, providerMatchesLocation } from "@/lib/recyclingTaxonomy";

const TYPE_LABELS = { municipal: "Municipal service", public_facility: "Public facility", private_business: "Private business", independent: "Independent provider" };
const SERVICE_LABELS = { drop_off: "Drop-off", collection: "Collection", both: "Drop-off & collection" };

export default function RecyclingDirectory() {
  useSEO({
    title: "Recycling Directory — Verified Services Across Canada",
    description: "Search recycling listings by material or location. View provider verification status, accepted items and contact details; availability varies by area.",
    path: "/recycling",
  });
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(urlParams.get("q") || "");
  const [location, setLocation] = useState(urlParams.get("loc") || "");
  const [providers, setProviders] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: "wrong_info", details: "", reporter_email: "" });
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Provider.filter({}, { sort: "-created_date", limit: 500 });
        setProviders(res.items || res);
      } catch {
        setProviders([]);
      }
    })();
  }, []);

  const results = useMemo(() => {
    if (!providers) return [];
    return providers.filter(
      (p) => providerMatchesQuery(p, query) && providerMatchesLocation(p, location) && (!catFilter || (p.accepted_categories || []).includes(catFilter))
    );
  }, [providers, query, location, catFilter]);

  const queryCats = matchCategories(query);

  const submitReport = async () => {
    try {
      await base44.entities.ListingReport.create({ provider_id: reporting.id, provider_name: reporting.name, ...reportForm });
    } catch {
      // still close and show confirmation
    }
    setReporting(null);
    setReportSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <div className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Recycling services across Canada</h1>
          <p className="text-emerald-100/70 mt-2 max-w-2xl text-sm leading-relaxed">
            Search by material, product, or service — then by postal code, city, or province. Accepted materials are set by each facility or program; always confirm restrictions before you go.
          </p>
          <form
            className="mt-6 flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/recycling?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`);
            }}
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Material, product, or service (e.g. mattress, paint, e-waste)" className="input !bg-white pl-10" />
            </div>
            <div className="relative sm:w-72">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Postal code, city, or province" className="input !bg-white pl-10" />
            </div>
            <button type="submit" className="rounded-xl bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setCatFilter(null)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${!catFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>All categories</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCatFilter(catFilter === c.key ? null : c.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${catFilter === c.key ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {providers === null ? (
          <p className="text-sm text-slate-400 py-16 text-center">Loading listings…</p>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h2 className="font-bold text-slate-800">No listings confirmed for this search yet</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Our directory only shows providers we can attribute to a source. We don't list unverified facilities as confirmed.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <Link to="/recycling-assistant" className="rounded-full bg-emerald-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-emerald-600">Ask the Recycling Assistant</Link>
              <Link to="/contact" className="rounded-full border border-slate-300 text-slate-700 font-bold px-5 py-2.5 text-sm hover:border-emerald-400">Suggest a facility</Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <p className="md:col-span-2 text-xs text-slate-500 mb-1">{results.length} listing{results.length === 1 ? "" : "s"}{queryCats.length ? ` matching “${query}”` : ""}</p>
            {results.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/provider/${p.id}`} className="font-bold text-slate-900 hover:text-emerald-600">{p.name}</Link>
                    <div className="text-xs text-slate-500 mt-0.5">{TYPE_LABELS[p.provider_type] || p.provider_type} · {SERVICE_LABELS[p.service_type] || p.service_type}</div>
                  </div>
                  {p.verification === "verified" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold shrink-0"><ShieldCheck className="w-3 h-3" /> Verified</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-[10px] font-bold shrink-0"><ShieldAlert className="w-3 h-3" /> Unverified</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-2 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />{[p.address, p.city, p.province].filter(Boolean).join(", ") || "Contact for location"}</div>
                {p.accepted_categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.accepted_categories.slice(0, 4).map((k) => (
                      <span key={k} className="rounded-full bg-[#f4f7f5] text-[#102B2A] px-2.5 py-1 text-[10px] font-bold">{CATEGORY_LABELS[k] || k}</span>
                    ))}
                    {p.accepted_categories.length > 4 && <span className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[10px] font-bold">+{p.accepted_categories.length - 4} more</span>}
                  </div>
                )}
                {p.fees && <div className="text-xs text-slate-600 mt-3 flex items-center gap-1.5"><HandCoins className="w-3.5 h-3.5 text-slate-400 shrink-0" />{p.fees}</div>}
                {p.hours && <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />{p.hours}</div>}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <Link to={`/provider/${p.id}`} className="font-bold text-emerald-600 hover:underline">View details</Link>
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600"><Globe className="w-3.5 h-3.5" />Website</a>}
                    {p.booking_url && <a href={p.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600"><Truck className="w-3.5 h-3.5" />Book</a>}
                  </div>
                  <button onClick={() => { setReporting(p); setReportSent(false); setReportForm({ reason: "wrong_info", details: "", reporter_email: "" }); }} className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 font-semibold"><Flag className="w-3.5 h-3.5" />Report</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {reporting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-6" onClick={() => setReporting(null)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Report a problem with this listing</h3>
              <button onClick={() => setReporting(null)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{reporting.name} — our team reviews every report before updating the directory.</p>
            <label className="text-xs font-bold text-slate-600 block mb-1">What's wrong?</label>
            <select value={reportForm.reason} onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })} className="input !py-2.5 mb-3">
              <option value="wrong_info">Information is wrong</option>
              <option value="closed">Facility has closed</option>
              <option value="wrong_materials">Accepted materials are wrong</option>
              <option value="wrong_contact">Contact details are wrong</option>
              <option value="duplicate">Duplicate listing</option>
              <option value="other">Something else</option>
            </select>
            <label className="text-xs font-bold text-slate-600 block mb-1">Details</label>
            <textarea value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} rows="3" maxLength="1000" className="input mb-3" placeholder="What should we correct?" />
            <label className="text-xs font-bold text-slate-600 block mb-1">Your email (optional)</label>
            <input type="email" value={reportForm.reporter_email} onChange={(e) => setReportForm({ ...reportForm, reporter_email: e.target.value })} className="input mb-4" placeholder="So we can follow up" />
            <button onClick={submitReport} className="w-full rounded-xl bg-emerald-500 text-white font-bold py-3 hover:bg-emerald-600">Send report</button>
          </div>
        </div>
      )}

      {reportSent && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 text-white text-sm font-bold px-5 py-3 shadow-xl">
          Thanks — report received for review.
          <button onClick={() => setReportSent(false)} className="ml-3 text-slate-400 hover:text-white" aria-label="Dismiss"><X className="w-4 h-4 inline" /></button>
        </div>
      )}

      <Footer />
    </div>
  );
}