import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, Globe, Clock, ShieldCheck, ShieldAlert, Flag, X, Truck, Landmark, Building2, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { CATEGORY_LABELS } from "@/lib/recyclingTaxonomy";
import { useSEO } from "@/lib/seo";

const TYPE_LABELS = { municipal: "Municipal service", public_facility: "Public facility", private_business: "Private business", independent: "Independent provider" };
const SERVICE_LABELS = { drop_off: "Drop-off", collection: "Collection / pickup", both: "Drop-off & collection" };
const TYPE_ICONS = { municipal: Landmark, public_facility: Building2, private_business: Building2, independent: User };

export default function ProviderDetail() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "wrong_info", details: "", reporter_email: "" });
  const [reportSent, setReportSent] = useState(false);
  const currentProvider = provider?.id === id ? provider : null;
  const providerLocation = [currentProvider?.city, currentProvider?.province].filter(Boolean).join(", ");
  useSEO({
    title: currentProvider ? `${currentProvider.name}${providerLocation ? ` in ${providerLocation}` : ""} | Same Day Recycling` : `${notFound ? "Listing Not Found" : "Loading Recycling Listing"} | Same Day Recycling`,
    description: currentProvider ? `View ${currentProvider.name}${providerLocation ? ` in ${providerLocation}` : ""}: reported materials, contact details and verification status. Confirm fees and availability with the provider.`.slice(0, 170) : "Browse recycling provider listings and confirm facility information before visiting.",
    path: `/provider/${encodeURIComponent(id)}`,
    robots: currentProvider ? "index, follow" : "noindex, follow",
  });

  useEffect(() => {
    (async () => {
      try {
        const p = await base44.entities.Provider.get(id);
        if (!p) { setNotFound(true); return; }
        setProvider(p);
      } catch {
        setNotFound(true);
      }
      try {
        const r = await base44.entities.Review.filter({ provider_id: id, approved: true });
        setReviews(r.items || r || []);
      } catch {
        setReviews([]);
      }
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <TopBar />
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Listing not found</h1>
          <Link to="/recycling" className="inline-block mt-4 rounded-full bg-emerald-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-emerald-600">Back to directory</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <TopBar />
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-400 text-sm">Loading listing…</div>
        <Footer />
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[provider.provider_type] || Building2;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/recycling" className="inline-block text-xs font-bold text-slate-500 hover:text-emerald-600 mb-4">← Back to directory</Link>
        {provider.sponsored && (
          <div className="mb-4 inline-block rounded-full bg-gold/20 text-amber-700 border border-gold/50 px-3 py-1 text-[10px] font-bold tracking-wide">SPONSORED LISTING</div>
        )}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{provider.name}</h1>
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><TypeIcon className="w-4 h-4" />{TYPE_LABELS[provider.provider_type] || provider.provider_type} · {SERVICE_LABELS[provider.service_type] || provider.service_type}</div>
            </div>
            {provider.verification === "verified" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold"><ShieldCheck className="w-4 h-4" /> Verified</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-bold"><ShieldAlert className="w-4 h-4" /> Unverified</span>
            )}
          </div>

          <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            {[
              [MapPin, "Address", [provider.address, provider.city, provider.province, provider.postal_code].filter(Boolean).join(", ")],
              [Phone, "Phone", provider.phone],
              [Clock, "Hours", provider.hours],
              [Globe, "Website", provider.website],
              [Truck, "Booking", provider.booking_url],
              [MapPin, "Service area", provider.service_area],
            ].map(([Icon, label, value]) =>
              value ? (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="text-slate-700 font-medium break-words">{String(value).startsWith("http") ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{label === "Booking" ? "Open booking page" : value}</a> : value}</dd>
                  </div>
                </div>
              ) : null
            )}
          </dl>

          {provider.accepted_categories?.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Accepted materials (as reported by this facility)</div>
              <div className="flex flex-wrap gap-2">
                {provider.accepted_categories.map((k) => (
                  <span key={k} className="rounded-full bg-[#f4f7f5] text-[#102B2A] px-3 py-1.5 text-xs font-bold border border-emerald-100">{CATEGORY_LABELS[k] || k}</span>
                ))}
              </div>
            </div>
          )}
          {provider.materials_note && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{provider.materials_note}</p>}
          {provider.fees && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fees</div>
              <div className="text-slate-700 font-medium">{provider.fees}</div>
            </div>
          )}
          {provider.notes && <p className="text-xs text-slate-500 mt-4 leading-relaxed">{provider.notes}</p>}

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {provider.source_name && <div>Source: {provider.source_url ? <a href={provider.source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{provider.source_name}</a> : provider.source_name}</div>}
              {provider.last_confirmed_date && <div className="mt-0.5">Last confirmed: {provider.last_confirmed_date}</div>}
            </div>
            <button onClick={() => { setReporting(true); setReportForm({ reason: "wrong_info", details: "", reporter_email: "" }); }} className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-red-600"><Flag className="w-3.5 h-3.5" />Report a problem</button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-lg font-bold">Customer reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-400 mt-2">No verified customer reviews for this listing yet. We only publish reviews we can attribute to real customers.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">{r.customer_name} <span className="text-amber-500">{"★".repeat(Math.round(r.rating))}</span></div>
                  <p className="text-sm text-slate-600 mt-1">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {reporting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-6" onClick={() => setReporting(false)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Report a problem with this listing</h3>
              <button onClick={() => setReporting(false)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
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
            <input type="email" value={reportForm.reporter_email} onChange={(e) => setReportForm({ ...reportForm, reporter_email: e.target.value })} className="input mb-4" />
            <button
              onClick={async () => {
                try { await base44.entities.ListingReport.create({ provider_id: provider.id, provider_name: provider.name, ...reportForm }); } catch {}
                setReporting(false);
                setReportSent(true);
              }}
              className="w-full rounded-xl bg-emerald-500 text-white font-bold py-3 hover:bg-emerald-600"
            >
              Send report
            </button>
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