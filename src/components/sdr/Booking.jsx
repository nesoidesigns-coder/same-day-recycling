import { Recycle, Leaf, Truck } from "lucide-react";
import BookingForm from "./BookingForm";

export default function Booking({ prefill }) {
  return (
    <section id="book" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Book now</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Get it gone today.</h2>
          <p className="mt-5 text-lg text-slate-600 max-w-md">
            Fill out the form — we route your request to a verified local contractor, and your pickup window and upfront price are confirmed with you before anything is scheduled. Nothing is charged before confirmation.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Leaf, t: "Recycled or donated", d: "Everything we can is diverted from the landfill." },
              { icon: Truck, t: "Same-day matching", d: "Book before noon where contractor availability is live — confirmed per job, never assumed." },
              { icon: Recycle, t: "Responsible disposal", d: "Properly sorted loads — recycled or donated first." },
            ].map((p) => (
              <div key={p.t} className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-2xl bg-[#187B65]/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-[#187B65]" />
                </span>
                <div>
                  <div className="font-bold text-[#102B2A]">{p.t}</div>
                  <div className="text-slate-600 text-sm">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BookingForm prefill={prefill} />
      </div>
    </section>
  );
}