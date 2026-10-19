import { cityContentFor } from "@/lib/cityContent";
import { ChevronDown, MapPin } from "lucide-react";

export default function CityGuide({ city }) {
  const content = cityContentFor(city.slug);
  if (!content) return null;

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">
          <MapPin className="w-4 h-4" />
          Local Guide
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24]">
          Junk removal in {city.name}, BC — what locals should know
        </h2>
        {content.guide.map((p, i) => (
          <p key={i} className="mt-5 text-slate-600 leading-relaxed">{p}</p>
        ))}

        <h3 className="mt-10 text-xl font-bold text-[#0c3b24]">
          {city.name} junk removal FAQ
        </h3>
        <div className="mt-4 divide-y divide-slate-100 rounded-3xl border border-slate-100 bg-[#f4f7f5]">
          {content.faqs.map(([q, a], i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[#0c3b24]">
                {q}
                <ChevronDown className="w-5 h-5 text-[#1d9e56] shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}