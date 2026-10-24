import { Link } from "react-router-dom";
import { Truck, MonitorSmartphone, ArrowRight, ShieldCheck } from "lucide-react";

export default function BusinessSolutions() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
        <div className="max-w-2xl mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold tracking-[0.16em] uppercase text-[#102B2A]">
            <ShieldCheck className="w-4 h-4 text-[#187B65]" /> Business &amp; operators
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">Built for the people who run recycling</h2>
          <p className="mt-3 text-slate-600">
            Two ways to work with the network: operate pickups as a verified partner, or license the platform that powers it.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl bg-[#f3f7f5] border border-slate-100 p-8 flex flex-col">
            <span className="w-11 h-11 rounded-2xl bg-[#187B65]/15 text-[#187B65] flex items-center justify-center mb-5">
              <Truck className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-[#102B2A]">Partner with the network</h3>
            <p className="mt-3 text-slate-600 leading-relaxed flex-1">
              Independent recycling and junk-removal operators get verified job assignments, dispatch support and
              territorial coverage — with every application reviewed before going live on the network.
            </p>
            <Link to="/contractor-onboarding" className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[#102B2A] text-white font-bold px-6 py-3 hover:bg-[#0d211f] transition-colors">
              Apply as an operator <ArrowRight className="w-4 h-4 text-[#54D9AE]" />
            </Link>
          </div>
          <div className="rounded-3xl bg-[#102B2A] border border-[#187B65]/30 p-8 flex flex-col">
            <span className="w-11 h-11 rounded-2xl bg-[#187B65]/20 text-[#54D9AE] flex items-center justify-center mb-5">
              <MonitorSmartphone className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-white">Same Day Recycling OS</h3>
            <p className="mt-3 text-emerald-100/70 leading-relaxed flex-1">
              Run your recycling business smarter: customers, scheduling, dispatch, invoicing and analytics in one
              secure dashboard — data-isolated per company and billed in CAD.
            </p>
            <Link to="/software" className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[#187B65] text-white font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors">
              Explore the software <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}