import { Phone } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-gold uppercase mb-5">
          <span className="w-8 h-px bg-gold" />
          Same-day service across British Columbia
          <span className="w-8 h-px bg-gold" />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Stop staring at it. We'll take it today.</h2>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors">
            Book a Pickup
          </a>
          <a href="tel:+16048491745" className="flex items-center gap-2 rounded-full border-2 border-white/30 text-white font-bold px-8 py-4 hover:bg-white/10 transition-colors">
            <Phone className="w-4 h-4 text-gold" /> (604) 849-1745
          </a>
        </div>
      </div>
    </section>
  );
}