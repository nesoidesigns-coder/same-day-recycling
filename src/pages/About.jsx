import { Link } from "react-router-dom";
import { Recycle, Leaf, Phone, Network } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

export default function About() {
  return (
    <div className="bg-white">
      <Navbar />
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">About us</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">The name is the promise.</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 md:py-20 space-y-10 text-lg text-slate-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">One belief</h2>
          <p>
            Same Day Recycling is a Canadian network built on one belief — the name is the promise. Same day.
            And actually recycled, not just hauled to landfill: metals go to real scrap buyers, gypsum to real
            recyclers, and furniture and usable goods to donation partners before anything else is considered.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">How it works for customers</h2>
          <p>
            You book online or by phone, the price is quoted upfront, and a truck arrives the same day to haul
            away sofas, mattresses, appliances, renovation debris and general clutter. Every load is sorted by
            hand so the smallest possible amount ends up in the landfill. We also run a free metal pickup
            service and a scheduled subscription plan for property managers who need recurring cleanups.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0c3b24] mb-3">Built with local partners</h2>
          <p>
            Founded in Vancouver, expanding city by city across Canada through local contractor partners who
            own their territories. Each partner runs their own trucks and crews; the network supplies the pages,
            the ads, a 24/7 receptionist that answers in five languages, and the booking machine that keeps
            every city filled.
          </p>
        </div>

        <div className="rounded-3xl bg-[#f4f7f5] border-l-4 border-[#1d9e56] p-8">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-2">Our mission</div>
          <p className="text-xl md:text-2xl font-bold text-[#0c3b24] leading-snug">
            "To clear Canada's junk the same day, at one honest upfront price, and actually recycle what
            we haul — not just wear the badge."
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          {[
            { icon: Recycle, t: "Actually recycled" },
            { icon: Leaf, t: "Donate what's usable" },
            { icon: Network, t: "Local partner territories" },
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/contractors" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-6 py-3 text-center hover:bg-[#0c3b24] hover:text-white transition-colors">Join the Network</Link>
            <a href="tel:+16048491745" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 text-center hover:bg-[#17a04c] transition-colors">Call (604) 849-1745</a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}