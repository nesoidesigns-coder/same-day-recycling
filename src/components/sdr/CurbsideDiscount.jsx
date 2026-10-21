export default function CurbsideDiscount() {
  return (
    <section id="curbside" className="bg-[#102B2A]">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-2">Curbside Discount</div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Leave it curbside, take $25 off</h2>
          <p className="mt-3 text-slate-300 max-w-xl">
            Stage your items in the driveway, lane or garage front and we handle the rest — you don't need to be home,
            and we text you the arrival window. Faster turnaround for our trucks means savings passed straight to you.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
          <a href="#book" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors text-center">
            Book curbside
          </a>
          <a href="tel:+16048491745" className="rounded-full border border-[#187B65] text-[#187B65] font-bold px-6 py-3.5 hover:bg-[#187B65]/10 transition-colors text-center">
            Call (604) 849-1745
          </a>
        </div>
      </div>
    </section>
  );
}