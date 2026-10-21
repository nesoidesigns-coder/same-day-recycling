import { useEffect } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import TrustBar from "@/components/sdr/TrustBar";
import GuideLeadMagnet from "@/components/sdr/GuideLeadMagnet";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

const BENEFITS = [
  ["Priority scheduling", "Property managers jump the same-day queue — a turnover unit gets a pickup window the same afternoon when you book before noon."],
  ["Upfront per-load pricing", "Priced by truck space, confirmed before we lift anything — no hourly meter running in your parkade."],
  ["Elevator & strata coordination", "We align with your building's move-out schedule, book around elevator reservations and protect floors and hallways."],
  ["Recycling receipts for records", "Every load comes with a receipt showing what was donated, recycled or disposed of — ready for strata minutes and reporting."],
  ["Recurring pickup plan", "A monthly subscription covers up to four pickups — built for turnover clusters, bulk weeks and lobby declutters."],
  ["One direct line, no call center", "You deal with local dispatch and the same local crews every time — not a franchise ticket system."],
];

export default function PropertyManagers() {
  useEffect(() => {
    document.title = "Reliable Junk Removal for Property Managers | Same Day Recycling";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Streamline your waste management with our professional junk removal services for property managers. Fast, reliable, and scheduled pickups available.");
  }, []);

  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">For property &amp; strata managers</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Bulk trash pickup for apartments — scheduled waste management across BC
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl">
            Turnover piles, tenant bulk items, lobby declutters and renovation debris — cleared fast, priced upfront, with a recycling receipt for your records.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 text-center hover:bg-[#17a04c] transition-colors">
              Book a pickup
            </Link>
            <a href="#guide" className="rounded-full border border-white/30 text-white font-bold px-7 py-3.5 text-center hover:bg-white/10 transition-colors">
              Get the free disposal guide
            </a>
          </div>
        </div>
      </section>
      <TrustBar />
      <section className="bg-[#f4f7f5] border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Case study</div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0c3b24]">
            40 units turned over in one downtown high-rise
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            A Downtown strata manager had a burst of lease turnovers and a pile-up of tenant bulk items in the loading bay. We scheduled recurring pickups around the elevator calendar, staged everything curbside for a discount, and cleared all 40 units over three afternoons — with a recycling receipt for each load filed with the building's records.
          </p>
          <blockquote className="mt-6 rounded-2xl border border-slate-100 bg-white p-6">
            <p className="text-[#0c3b24] font-medium leading-relaxed">
              "Our loading bay used to fill up with tenant junk between council meetings. Now one call clears it the same day, and I get a receipt I can put in the strata file."
            </p>
            <footer className="mt-3 text-sm font-bold text-[#1d9e56]">Strata manager, downtown high-rise</footer>
          </blockquote>
        </div>
      </section>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Partner benefits</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">What building managers get</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-6">
                <h3 className="font-bold text-[#0c3b24]">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <GuideLeadMagnet />
      <FinalCTA />
      <Footer />
    </div>
  );
}