import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { Recycle, Leaf, Phone, Network } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

export default function About() {
  useSEO({
    title: "About Same Day Recycling — Canada's Recycling Network",
    description: "Same Day Recycling coordinates recycling, junk removal and commercial cleanouts through one intelligent Canadian service network.",
    path: "/about",
  });
  return (
    <div className="bg-white">
      <Navbar />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">About us</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">A national network, confirmed one job at a time.</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 md:py-20 space-y-10 text-lg text-slate-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold text-[#102B2A] mb-3">One belief</h2>
          <p>
            Same Day Recycling is a Canadian service-coordination network. We accept requests nationwide, but confirm each pickup only after a qualified contractor accepts the job, price and arrival window.
            Our aim is responsible reuse and recycling, not simply hauling to landfill: metals go to real scrap buyers, gypsum to real
            recyclers, and furniture and usable goods to donation partners before anything else is considered.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#102B2A] mb-3">How it works for customers</h2>
          <p>
            You submit a request online or by phone. Dispatch checks local provider availability, confirms your approved price and agrees an arrival window after a contractor accepts. Same-day service can be requested, but is never assumed from a city listing. Confirmed crews remove
            sofas, mattresses, appliances, renovation debris and general clutter. Every load is sorted by
            hand so the smallest possible amount ends up in the landfill. We also run a free metal pickup
            service and a scheduled subscription plan for property managers who need recurring cleanups.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#102B2A] mb-3">Built with local partners across Canada</h2>
          <p>
            Built on a simple promise, expanding city by city across Canada through local contractor partners who
            own their territories. Each partner runs their own trucks and crews; the network supplies the pages,
            the ads, a 24/7 receptionist that answers in five languages, and the booking machine that keeps
            every city filled.
          </p>
        </div>

        <div className="rounded-3xl bg-[#f4f7f5] border-l-4 border-[#187B65] p-8">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-2">Our mission</div>
          <p className="text-xl md:text-2xl font-bold text-[#102B2A] leading-snug">
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
              <b.icon className="w-5 h-5 text-[#187B65] shrink-0" />
              <span className="font-bold text-[#102B2A] text-sm">{b.t}</span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-[#f4f7f5] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-bold text-[#102B2A]">Need something gone today?</div>
            <div className="text-slate-600 mt-1">Book in minutes — we'll call you back within 30 minutes.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/contractors" className="rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-6 py-3 text-center hover:bg-[#102B2A] hover:text-white transition-colors">Join the Network</Link>
            <a href="tel:+16048491745" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 text-center hover:bg-[#125C4E] transition-colors">Call (604) 849-1745</a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}