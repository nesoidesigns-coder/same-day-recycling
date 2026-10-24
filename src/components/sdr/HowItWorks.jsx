const steps = [
  { n: "01", title: "Book in a minute", desc: "Call or book online — takes under sixty seconds." },
  { n: "02", title: "We match & confirm", desc: "A verified contractor accepts your job — you approve the upfront price before we lift a thing." },
  { n: "03", title: "We haul & recycle", desc: "Every load sorted: recycled, donated, or responsibly disposed." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Simple & fast</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-slate-100 p-8">
              <div className="text-5xl font-bold text-[#187B65] mb-4">{s.n}</div>
              <h3 className="text-xl font-bold text-[#102B2A]">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}