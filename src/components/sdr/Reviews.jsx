import { Star, Recycle } from "lucide-react";

const REVIEWS = [
  {
    name: "Melissa T.",
    city: "Vancouver",
    text: "Called at 10am, gone by 2pm. The crew swept the garage after loading and even took the old paint cans to proper disposal. Unreal service.",
  },
  {
    name: "Devon R.",
    city: "Surrey",
    text: "Booked a full truck for an estate cleanout. Price matched the online quote exactly, no surprises on arrival. Highly recommend.",
  },
  {
    name: "Priya K.",
    city: "Burnaby",
    text: "They donated our usable furniture to a local charity and sent photos of the sorted load. Best eco option I've found in the Lower Mainland.",
  },
  {
    name: "Grant M.",
    city: "Kelowna",
    text: "Property manager here — we use them for every unit turnover. Priority same-day slots are a lifesaver between tenants.",
  },
  {
    name: "Alison W.",
    city: "Richmond",
    text: "Fast, friendly and careful with the floors. Two sofas and a fridge out of a basement suite in under an hour.",
  },
  {
    name: "Chris B.",
    city: "Kamloops",
    text: "Transparent pricing, showed up in the exact window they promised. Will never rent a trailer and DIY again.",
  },
];

export default function Reviews() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Trusted locally</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">What customers say</h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex text-[#1d9e56]">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </span>
            <span className="text-sm font-semibold text-slate-600">Rated 4.9/5 across 7 cities</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-3xl bg-[#f4f7f5] p-6 flex flex-col">
              <div className="flex text-[#1d9e56] mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-700 leading-relaxed flex-1">“{r.text}”</p>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0c3b24] text-sm">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.city}</div>
                </div>
                <Recycle className="w-5 h-5 text-[#1d9e56]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}