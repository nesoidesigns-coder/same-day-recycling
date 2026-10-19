import { Link } from "react-router-dom";
import { Recycle, Leaf, Truck, Users } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import Footer from "@/components/sdr/Footer";

export default function About() {
  return (
    <div className="bg-white">
      <Navbar />
      <RexBanner message="I'm Rex, the AI running this whole operation. Nice to meet you!" />
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">About us</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">Junk gone today. Landfills lighter tomorrow.</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 md:py-20 space-y-10 text-lg text-slate-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">What we do</h2>
          <p>
            Same Day Recycling is a same-day junk and furniture removal service serving Vancouver and the Lower Mainland.
            You book online or by phone, we quote upfront, and our crews arrive the same day to haul away sofas, mattresses,
            appliances, construction debris and general clutter. Every load is sorted by hand: metal, electronics, furniture
            and usable goods are recycled or donated first, so the smallest possible amount ends up in the landfill. We also
            run a free metal pickup service — old appliances, car parts and bikes hauled away at no cost — and a scheduled
            subscription plan for property managers who need recurring cleanups across their buildings.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">Who it's for</h2>
          <p>
            Homeowners clearing out a basement, tenants moving out on short notice, realtors prepping a listing,
            landlords and property managers keeping buildings tidy, and small businesses with one-off cleanouts.
            If you need something gone today with upfront pricing and no hidden fees, we built this service for you.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">Who builds it</h2>
          <p>
            Same Day Recycling is built and operated by a local team based in Metro Vancouver. We dispatch our own crews
            and work with a vetted partner network of haulers across the Lower Mainland, all held to the same standard:
            upfront pricing, careful sorting, and recycling or donation before disposal. Every booking is confirmed by a
            real person before we lift a thing.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          {[
            { icon: Recycle, t: "Recycle-first" },
            { icon: Leaf, t: "Donate what's usable" },
            { icon: Truck, t: "Same-day dispatch" },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl bg-[#f4f7f5] p-5 flex items-center gap-3">
              <b.icon className="w-5 h-5 text-[#1d9e56] shrink-0" />
              <span className="font-bold text-[#0c3b24] text-sm">{b.t}</span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-[#f4f7f5] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-bold text-[#0c3b24]">Need something gone today?</div>
            <div className="text-slate-600 mt-1">Book in minutes — we'll call you back within 30 minutes.</div>
          </div>
          <div className="flex gap-3">
            <Link to="/free-metal-pickup" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#0c3b24] hover:text-white transition-colors">Free Metal Pickup</Link>
            <a href="tel:+16048491745" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors">Call (604) 849-1745</a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}