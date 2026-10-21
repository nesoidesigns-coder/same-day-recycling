import { Link } from "react-router-dom";
import { Scale, ShieldCheck, Users } from "lucide-react";

const MODELS = [
  {
    icon: Users,
    t: "Contractor network membership",
    d: "Access to the Same Day Recycling network and its platform-generated job opportunities. Membership pricing stays as published; any separately disclosed referral or dispatch fee is shown before you accept a job.",
  },
  {
    icon: ShieldCheck,
    t: "Standalone software license",
    d: "The operating system on its own: your customers, dispatch, scheduling, quotes, invoicing, payments and analytics. You keep 100% of revenue from customers you acquire yourself. Software licensing is independent of network membership.",
  },
  {
    icon: Scale,
    t: "Separately negotiated referral agreements",
    d: "Individually negotiated commission arrangements with written, disclosed terms. A referral agreement is never assumed and never applied globally — jobs you source yourself are not charged.",
  },
];

export default function LicenseClarity() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-8 md:p-12">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#187B65]">How the money works</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight admin-headline mt-2">
            Your Business. Your Customers. Your Revenue.
          </h2>
          <p className="text-emerald-100/60 mt-4 max-w-2xl mx-auto">
            Same Day Recycling provides professional software and network opportunities for independent
            recycling and junk removal companies. Keep the revenue from customers you acquire yourself.
            Pay only the fees agreed to under your selected services.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {MODELS.map((m) => (
            <div key={m.t} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-6">
              <span className="w-10 h-10 rounded-xl bg-[#187B65]/15 text-[#187B65] flex items-center justify-center mb-4">
                <m.icon className="w-5 h-5" />
              </span>
              <div className="font-bold text-[#54D9AE]">{m.t}</div>
              <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{m.d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-emerald-100/40 text-center mt-8 max-w-2xl mx-auto">
          We do not promise guaranteed jobs, earnings, exclusive territories or operational results.
          Software licensing and network membership are separate purchases; businesses may hold one, both, or neither.
        </p>
        <div className="text-center mt-6">
          <Link to="/contractors" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 text-sm hover:bg-[#187B65]/10 transition-colors">
            See the contractor network option
          </Link>
        </div>
      </div>
    </section>
  );
}