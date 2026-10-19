import { Hammer, Clock, DollarSign, Repeat, ShieldCheck, Phone } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import TradeLeadForm from "@/components/sdr/TradeLeadForm";
import Footer from "@/components/sdr/Footer";

const debrisItems = ["Drywall", "Lumber", "Flooring", "Fixtures", "Packaging", "Mixed renovation debris"];

const whyItems = [
  { icon: Clock, title: "Same-day pickup", text: "Debris gone today so your next trade starts on a clean floor tomorrow." },
  { icon: DollarSign, title: "Upfront pricing from $139", text: "You approve the price before we load. Flat quotes, no scale surprises." },
  { icon: Repeat, title: "Recurring scheduled pickups", text: "Weekly or per-phase hauls on a standing schedule — set it and forget it." },
  { icon: ShieldCheck, title: "Keep your site safe & client-ready", text: "Clean sites pass inspections and impress clients. We leave nothing behind." },
];

export default function Contractors() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="Contractors: I keep your sites clear on schedule." />
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
              <span className="w-8 h-px bg-[#1d9e56]"></span>For Contractors
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">Your site stays clean. We handle the debris.</h1>
            <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">Renovation debris hauled fast — without killing the job schedule. Book a one-time haul or a recurring pickup schedule.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">Book a Haul</a>
              <a href="tel:+16048491745" className="flex items-center justify-center gap-2 rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#0c3b24] hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> (604) 849-1745
              </a>
            </div>
          </div>
          <div className="rounded-3xl bg-[#f4f7f5] p-8">
            <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/10 flex items-center justify-center">
              <Hammer className="w-6 h-6 text-[#1d9e56]" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-[#0c3b24]">Built around job schedules</h2>
            <p className="mt-3 text-slate-600">We show up when you book, load what your crew stacked, and sweep the drop zone. One-time hauls or standing weekly pickups — your call.</p>
          </div>
        </div>
      </section>

      <section id="handle" className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">What we take</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            {debrisItems.map((d) => (
              <span key={d} className="rounded-full bg-white border border-slate-100 px-6 py-3 font-semibold text-[#0c3b24] shadow-sm hover:border-[#1d9e56] transition-colors">{d}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Why contractors use us</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyItems.map((w) => (
              <div key={w.title} className="rounded-3xl bg-[#f4f7f5] p-7">
                <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/10 flex items-center justify-center mb-5">
                  <w.icon className="w-6 h-6 text-[#1d9e56]" />
                </span>
                <h3 className="text-lg font-bold text-[#0c3b24]">{w.title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <TradeLeadForm
            title="Book a debris haul"
            subtitle="Site address and debris type — we'll confirm your slot fast."
            submitLabel="Request Pickup"
            fields={[
              { name: "name", label: "Your name", required: true, placeholder: "Dan Contractor" },
              { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "(604) 555-1234" },
              { name: "address", label: "Site address", required: true, placeholder: "456 Renovation Ave, Burnaby", full: true },
              { name: "debris_type", label: "Debris type", type: "select", required: true, options: debrisItems, placeholder: "Select debris type" },
              { name: "frequency", label: "One-time or recurring?", type: "select", required: true, options: ["One-time", "Recurring (weekly)", "Recurring (per phase)"], placeholder: "Select schedule" },
            ]}
            buildPayload={(f) => ({ name: f.name, phone: f.phone, address: f.address, items_description: `${f.debris_type} (contractor debris)`, time_window: f.frequency?.startsWith("Recurring") ? "Recurring" : "One-time", description: `Contractor lead from /contractors — ${f.frequency}` })}
          />
        </div>
      </section>

      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Debris piling up on site?</h2>
          <p className="mt-3 text-slate-300">Call or text and we'll get a truck moving.</p>
          <a href="tel:+16048491745" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors">
            <Phone className="w-5 h-5" /> Call or text (604) 849-1745
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}