import { Link } from "react-router-dom";
import { ArrowRight, Users, Truck, ClipboardList, Receipt, BarChart3 } from "lucide-react";

const PILLARS = [
  { icon: Users, label: "Customer inquiries" },
  { icon: Truck, label: "Contractor dispatch" },
  { icon: ClipboardList, label: "Job management" },
  { icon: Receipt, label: "Invoicing" },
  { icon: BarChart3, label: "Business analytics" },
];

export default function OperatingSystemPitch() {
  return (
    <section className="bg-[#102B2A]">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Grow Your Recycling Business With a Smarter Operating System
          </h2>
          <p className="mt-4 text-lg text-emerald-100/80">
            Canada generates millions of tonnes of waste every year. Is your business equipped to manage more opportunities?
          </p>
          <p className="mt-4 text-emerald-100/70 leading-relaxed">
            Same Day Recycling brings customer inquiries, contractor dispatch, job management, invoicing, and business analytics together in one platform.
          </p>
          <p className="mt-4 text-emerald-100/70 leading-relaxed">
            Whether you're an independent junk removal operator or an established recycling company, our goal is to help you spend less time coordinating paperwork and more time running your business.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3">
          {PILLARS.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-[#187B65]/30 bg-[#187B65]/10 p-4 flex flex-col items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#187B65]/25 text-[#54D9AE] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-bold text-white">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <p className="text-lg font-bold text-[#54D9AE]">
            One industry. One connected operating system. Built for Canadian recycling and removal professionals.
          </p>
          <Link to="/software" className="inline-flex items-center justify-center gap-2 self-start shrink-0 rounded-full bg-[#187B65] text-white font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors">
            Explore the platform <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-emerald-100/50">
          Industry statistics sourced from Statistics Canada. Software capabilities and availability are subject to the selected plan.
        </p>
      </div>
    </section>
  );
}