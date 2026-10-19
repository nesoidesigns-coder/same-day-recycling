import { Home, Clock, DollarSign, Camera, Recycle, KeyRound, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import TradeLeadForm from "@/components/sdr/TradeLeadForm";
import Footer from "@/components/sdr/Footer";

const handleItems = [
  { icon: Home, title: "Full-home cleanouts", text: "Estate and eviction clearouts, top to bottom, ready for listing photos." },
  { icon: KeyRound, title: "Garage & basement", text: "Years of storage gone in an afternoon, including appliances and old furniture." },
  { icon: Home, title: "Yard debris", text: "Branches, fencing, patio furniture and outdoor clutter hauled away." },
];

const whyItems = [
  { icon: Clock, title: "Same-day service", text: "Book before noon and the cleanout happens today, before your open house." },
  { icon: DollarSign, title: "Upfront pricing from $139", text: "You approve the price before we lift a thing. No surprises, no hidden fees." },
  { icon: Camera, title: "Before/after photos", text: "Every job documented with photos for your file and your client." },
  { icon: Recycle, title: "We recycle & donate", text: "Usable items go to donation partners — a story your sellers love." },
];

export default function Realtors() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="Realtors: I make listings photo-ready by dinner." />
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
              <span className="w-8 h-px bg-[#1d9e56]"></span>For Realtors
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">Closing-ready cleanouts, on your timeline.</h1>
            <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">Estate cleanouts, eviction clearouts and pre-listing decluttering — done fast, so your listing never waits on a room full of stuff.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">Book a Cleanout</a>
              <a href="tel:+16048491745" className="flex items-center justify-center gap-2 rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#0c3b24] hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> (604) 849-1745
              </a>
            </div>
          </div>
          <div className="rounded-3xl bg-[#f4f7f5] p-8">
            <h2 className="text-xl font-bold text-[#0c3b24]">Realtor partner program</h2>
            <p className="mt-3 text-slate-600">Send us your listings and we prioritize your jobs — same-day slots held for partner agents, before/after photos in your inbox, and one invoice for repeat cleanouts.</p>
            <p className="mt-4 text-sm font-semibold text-[#0c3b24]">Book below or call/text <a href="tel:+16048491745" className="text-[#1d9e56]">(604) 849-1745</a> and ask for the partner rate.</p>
            <p className="mt-3 text-sm font-semibold"><Link to="/realtor-dashboard" className="text-[#1d9e56] hover:underline">Track your cleanout requests →</Link></p>
          </div>
        </div>
      </section>

      <section id="handle" className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">What we handle</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {handleItems.map((s) => (
              <div key={s.title} className="rounded-3xl bg-white p-7 border border-slate-100 hover:border-[#1d9e56] hover:shadow-lg transition-all">
                <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/10 flex items-center justify-center mb-5">
                  <s.icon className="w-6 h-6 text-[#1d9e56]" />
                </span>
                <h3 className="text-xl font-bold text-[#0c3b24]">{s.title}</h3>
                <p className="mt-2 text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Why realtors use us</h2>
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
            title="Book a cleanout"
            subtitle="Tell us the property and what needs clearing — we'll confirm your slot fast."
            submitLabel="Request Cleanout"
            fields={[
              { name: "name", label: "Your name", required: true, placeholder: "Jane Realtor" },
              { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "(604) 555-1234" },
              { name: "address", label: "Property address", required: true, placeholder: "123 Main St, Vancouver", full: true },
              { name: "items_description", label: "What needs clearing", type: "textarea", required: true, placeholder: "Whole house: furniture, garage, yard debris", full: true },
              { name: "preferred_date", label: "Needed by", type: "date" },
            ]}
            buildPayload={(f) => ({ name: f.name, phone: f.phone, address: f.address, items_description: f.items_description, preferred_date: f.preferred_date, description: "Realtor lead from /realtors" })}
          />
        </div>
      </section>

      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Need it cleared today?</h2>
          <p className="mt-3 text-slate-300">Call or text and we'll get a crew moving.</p>
          <a href="tel:+16048491745" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors">
            <Phone className="w-5 h-5" /> Call or text (604) 849-1745
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}