import { Link } from "react-router-dom";

export default function FinalCTA() {
  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-gold uppercase mb-5">
          <span className="w-8 h-px bg-gold" />
          Smart Removal · Responsible Recycling · Reliable Service
          <span className="w-8 h-px bg-gold" />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to Reclaim Your Space?</h2>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#estimator" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#25b96b] transition-colors">
            Get My Estimate
          </a>
          <Link to="/contact" className="rounded-full border-2 border-white/30 text-white font-bold px-8 py-4 hover:bg-white/10 transition-colors">
            Contact Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}