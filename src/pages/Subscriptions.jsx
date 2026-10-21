import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import SubSignup from "@/components/sdr/SubSignup";
import RexBanner from "@/components/sdr/RexBanner";
import { CalendarCheck, Zap, ShieldCheck, Recycle } from "lucide-react";

const PERKS = [
  { icon: CalendarCheck, t: "Up to 4 pickups a month", d: "One flat $299/month — no per-trip scheduling fees." },
  { icon: Zap, t: "Priority same-day slots", d: "Members jump the queue. Book before noon, gone today." },
  { icon: Recycle, t: "Eco disposal reporting", d: "Donation and recycling receipts for every load." },
  { icon: Recycle, t: "Eco-friendly disposal", d: "Recycled or donated first, on every visit." },
];

export default function Subscriptions() {
  useSEO({
    title: "Recurring Cleanout Subscriptions | Same Day Recycling",
    description: "Review recurring cleanout pickup plans for property managers, stratas and businesses. Compare plan details and confirm coverage before signing up.",
    path: "/subscriptions",
  });
  return (
    <div className="bg-white">
      <RexBanner message="Property managers: your recurring cleanouts, handled." />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">For property managers</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Junk removal, on retainer.
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
            The Same Day Recycling Plan keeps your properties clear: $299/month covers up to 4 pickups with priority dispatch. Perfect for turnovers, evictions and ongoing cleanouts. Extra pickups beyond the 4 included in a month are scheduled at standard tier rates, quoted and approved with you before each pickup.
          </p>
          <div className="mt-8 inline-flex items-baseline gap-2">
            <span className="text-6xl font-bold">$299</span>
            <span className="text-lg text-slate-300 font-semibold">/month</span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PERKS.map((p) => (
              <div key={p.t} className="rounded-3xl bg-[#f4f7f5] p-6">
                <span className="w-11 h-11 rounded-2xl bg-[#187B65]/10 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-[#187B65]" />
                </span>
                <div className="font-bold text-[#102B2A]">{p.t}</div>
                <div className="text-sm text-slate-600 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-[#f4f7f5] p-6">
            <div className="font-bold text-[#102B2A] mb-2">How signup works</div>
            <p className="text-sm text-slate-600">
              Submit the form and we'll call you within one business day to confirm your plan, set up monthly billing over the phone, and lock in your first priority pickup. No contract — cancel anytime.
            </p>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Questions? Call <a href="tel:+16048491745" className="font-semibold text-[#187B65] hover:underline">(604) 849-1745</a> or <Link to="/" className="font-semibold text-[#187B65] hover:underline">see how single pickups work</Link>.
          </p>
        </div>
        <div id="signup">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Join the plan</div>
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A] mb-6">Sign up in one minute</h2>
          <SubSignup />
        </div>
      </section>
    </div>
  );
}