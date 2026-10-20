import { Building2, ClipboardCheck, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const points = [
  { icon: Building2, title: "Elevator booked for you", text: "We reserve the service elevator and file the booking notice with your building — you don't chase the manager." },
  { icon: ClipboardCheck, title: "Strata-ready paperwork", text: "Insurance certificate and building requirements on file, ready to send to your property manager." },
  { icon: Clock, title: "Loading-dock timing", text: "We work inside your building's dock hours and quiet times, same-day or scheduled." },
  { icon: FileText, title: "One receipt for the file", text: "A single invoice plus a Recycling Receipt your strata can keep on record." },
];

export default function CondoStrata() {
  return (
    <section id="condo" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Condos &amp; strata</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Condo cleanouts, handled by the book</h2>
          <p className="mt-4 text-slate-600">
            High-density buildings in Vancouver, Burnaby and Richmond are our specialty. We know the elevator rules,
            the paperwork and the dock etiquette — so your cleanout happens without a single complaint from the building.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {points.map((p) => (
            <div key={p.title} className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6">
              <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5" />
              </span>
              <div className="font-bold text-[#0c3b24]">{p.title}</div>
              <p className="mt-2 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors text-center">
            Book a condo cleanout
          </a>
          <Link to="/subscriptions" className="rounded-full border border-slate-200 text-[#0c3b24] font-bold px-7 py-3.5 hover:border-[#1d9e56] hover:text-[#1d9e56] transition-colors text-center">
            Property manager? See the monthly plan
          </Link>
        </div>
      </div>
    </section>
  );
}