import { Sofa, Refrigerator, Home, HardHat, Building2, MapPin } from "lucide-react";

const services = [
  { icon: Sofa, title: "Furniture Removal", desc: "Sofas, mattresses, tables, dressers" },
  { icon: Refrigerator, title: "Appliance Removal", desc: "Fridges, washers, dryers, stoves" },
  { icon: Home, title: "Estate & Rental Cleanouts", desc: "Full property clear-outs" },
  { icon: HardHat, title: "Renovation Debris", desc: "Drywall, lumber, flooring" },
  { icon: Building2, title: "Office Cleanouts", desc: "Desks, chairs, electronics" },
  { icon: MapPin, title: "Curbside Pickup", desc: "Leave it outside, pay less" },
];

export default function Services() {
  return (
    <section id="services" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">What we haul</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Services</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.title} className="group rounded-3xl bg-white p-7 border border-slate-100 hover:border-[#187B65] hover:shadow-lg transition-all">
              <span className="w-12 h-12 rounded-2xl bg-[#187B65]/10 flex items-center justify-center mb-5 group-hover:bg-[#187B65] transition-colors">
                <s.icon className="w-6 h-6 text-[#187B65] group-hover:text-white transition-colors" />
              </span>
              <h3 className="text-xl font-bold text-[#102B2A]">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}