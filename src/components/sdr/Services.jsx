import { Link } from "react-router-dom";
import { Sofa, Refrigerator, Home, HardHat, Building2, Truck, ArrowRight } from "lucide-react";

// Six straightforward service categories. Each card carries a short,
// everyday description and a direct quote action — no decorative labels.
const services = [
  { icon: Sofa, title: "Furniture Removal", desc: "Sofas, mattresses, tables and dressers, hauled away responsibly." },
  { icon: Refrigerator, title: "Appliance Removal", desc: "Fridges, washers, dryers and stoves, safely removed and recycled." },
  { icon: Truck, title: "Moving Cleanouts", desc: "Clear out what's left behind before or after your move." },
  { icon: Home, title: "Estate & Property Cleanouts", desc: "Full property clear-outs, handled with care and respect." },
  { icon: HardHat, title: "Construction Debris", desc: "Drywall, lumber and flooring hauled off site." },
  { icon: Building2, title: "Commercial Services", desc: "Office, retail and property management pickups on your schedule." },
];

export default function Services() {
  return (
    <section id="services" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">What we haul</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Services</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.title} className="group flex flex-col rounded-3xl bg-[#f4f7f5] p-7 border border-slate-100 hover:border-[#187B65] hover:shadow-lg transition-all">
              <span className="w-12 h-12 rounded-2xl bg-[#187B65]/10 flex items-center justify-center mb-5 group-hover:bg-[#187B65] transition-colors">
                <s.icon className="w-6 h-6 text-[#187B65] group-hover:text-white transition-colors" />
              </span>
              <h3 className="text-xl font-bold text-[#102B2A]">{s.title}</h3>
              <p className="mt-2 text-slate-600 flex-1">{s.desc}</p>
              <Link
                to="/request-service"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline"
              >
                Get an estimate <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}