import { Link } from "react-router-dom";
import { CalendarCheck, ArrowRight } from "lucide-react";

export default function SubTeaser() {
  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Property managers</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One plan. Clear properties, every month.</h2>
          <p className="mt-4 text-slate-300 max-w-md">
            $299/month covers up to 4 pickups with priority same-day slots — built for turnovers and ongoing cleanouts.
          </p>
        </div>
        <div className="lg:justify-self-end w-full max-w-sm">
          <div className="rounded-3xl bg-white/10 border border-white/15 p-6 backdrop-blur">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">$299</span>
              <span className="text-slate-300 font-semibold">/month</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-[#1d9e56]" /> Up to 4 pickups/month</div>
              <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-[#1d9e56]" /> Priority same-day slots</div>
            </div>
            <Link to="/subscriptions" className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors flex items-center justify-center gap-2">
              See the plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}