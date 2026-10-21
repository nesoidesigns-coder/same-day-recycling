const cities = ["Vancouver", "Burnaby", "Richmond", "Surrey", "Coquitlam", "North Vancouver", "West Vancouver", "New Westminster", "Delta", "Langley", "Port Moody"];

export default function ServiceArea() {
  return (
    <section id="service-area" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Where we work</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Service area</h2>
          <p className="mt-4 text-slate-600">A national agency — same-day trucks live across the Lower Mainland today, with partner territories opening Canada-wide.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {cities.map((c) => (
            <span key={c} className="rounded-full border-2 border-[#0c3b24]/15 bg-[#f4f7f5] px-5 py-2.5 font-semibold text-[#0c3b24] hover:border-[#1d9e56] hover:bg-[#1d9e56]/10 transition-colors">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}