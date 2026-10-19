import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Mail, Quote as QuoteIcon, MessageSquareText, Inbox, Phone } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

const STEPS = [
  { key: "new", label: "Requested" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "booked", label: "Booked" },
  { key: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-amber-100 text-amber-800",
  quoted: "bg-sky-100 text-sky-800",
  booked: "bg-[#1d9e56]/15 text-[#0c3b24]",
  closed: "bg-[#0c3b24] text-white",
};

function LeadCard({ lead }) {
  const stepIndex = STEPS.findIndex((s) => s.key === lead.status);
  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 hover:border-[#1d9e56] hover:shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-[#0c3b24] flex items-start gap-2">
            <MapPin className="w-5 h-5 mt-1 text-[#1d9e56] shrink-0" />
            {lead.property_address}
          </h3>
          <p className="mt-1 text-sm text-slate-500 pl-7">
            Submitted {new Date(lead.created_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span className={`shrink-0 self-start rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}>
          {STEPS[stepIndex]?.label || lead.status}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-[#1d9e56]" : "bg-slate-100"}`}></div>
            <p className={`mt-1.5 text-[10px] md:text-xs font-semibold ${i <= stepIndex ? "text-[#0c3b24]" : "text-slate-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <dl className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="font-semibold text-[#0c3b24]">Items to clear</dt>
          <dd className="mt-0.5 text-slate-600">{lead.items_description || "As discussed"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0c3b24] flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#1d9e56]" /> Needed by</dt>
          <dd className="mt-0.5 text-slate-600">{lead.preferred_date || "Flexible"}</dd>
        </div>
        {lead.quote_low != null && (
          <div>
            <dt className="font-semibold text-[#0c3b24] flex items-center gap-1.5"><QuoteIcon className="w-4 h-4 text-[#1d9e56]" /> Your quote</dt>
            <dd className="mt-0.5 text-slate-600 font-semibold">
              ${lead.quote_low} – ${lead.quote_high}{lead.load_label ? ` (${lead.load_label})` : ""}
            </dd>
          </div>
        )}
      </dl>

      {lead.ai_reply && (
        <div className="mt-5 rounded-2xl bg-[#f4f7f5] p-4 text-sm text-slate-700 flex gap-3">
          <MessageSquareText className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#0c3b24] text-xs uppercase tracking-wide mb-1">Latest update from our team</p>
            {lead.ai_reply}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RealtorDashboard() {
  const [me, setMe] = useState(null);
  const [leads, setLeads] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        const { items } = await base44.entities.RealtorLead.filter({ email: user.email }, { sort: "-created_date", limit: 50 });
        setLeads(items);
      } catch {
        setLeads([]);
      }
    })();
  }, []);

  const activeCount = (leads || []).filter((l) => l.status !== "closed").length;

  return (
    <div className="bg-white min-h-screen">
      <TopBar />
      <Navbar />

      <section className="bg-[#f4f7f5]">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-4">
            <span className="w-8 h-px bg-[#1d9e56]"></span>Realtor Partner Portal
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">
            Your cleanout requests
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl">
            {me ? `Signed in as ${me.email}.` : "Loading…"}{" "}
            {activeCount > 0 && <span className="font-semibold text-[#0c3b24]">{activeCount} request{activeCount === 1 ? "" : "s"} in progress.</span>}
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 flex flex-col gap-5">
          {leads === null && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
            </div>
          )}

          {leads !== null && leads.length === 0 && (
            <div className="rounded-3xl bg-[#f4f7f5] p-10 text-center">
              <Inbox className="w-10 h-10 text-[#1d9e56] mx-auto" />
              <h2 className="mt-4 text-xl font-bold text-[#0c3b24]">No cleanout requests yet</h2>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                Requests appear here automatically once submitted with this email. Use the same email you entered on the request form.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/realtors" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors">Request a cleanout</Link>
                <a href="tel:+16048491745" className="flex items-center justify-center gap-2 rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#0c3b24] hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> (604) 849-1745
                </a>
              </div>
            </div>
          )}

          {leads !== null && leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      </section>

      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Adding another property?</h2>
          <p className="mt-2 text-slate-300 text-sm">Submit the request with this same email and it will show up here automatically.</p>
          <Link to="/realtors" className="mt-6 inline-block rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors">Book a Cleanout</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}