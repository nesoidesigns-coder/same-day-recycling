import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-[#f4f7f5]">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-5">
          <span className="w-8 h-px bg-[#187B65]" />
          Smart Removal · Responsible Recycling · Reliable Service
          <span className="w-8 h-px bg-[#187B65]" />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Ready to Reclaim Your Space?</h2>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/#book" className="rounded-full bg-amber-500 text-[#102B2A] font-bold px-8 py-4 hover:bg-amber-600 hover:text-white transition-colors inline-flex items-center gap-2">
            Get My Estimate <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/contact" className="rounded-full border-2 border-[#102B2A]/20 text-[#102B2A] font-bold px-8 py-4 hover:border-[#102B2A] transition-colors">
            Contact Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}