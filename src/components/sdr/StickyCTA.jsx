import { Phone } from "lucide-react";

export default function StickyCTA() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="text-center text-[11px] font-bold text-[#102B2A] tracking-wide pb-1.5">
        Same-day service — book before noon, gone by this afternoon
      </div>
      <div className="flex items-center gap-2">
        <a href="#book" className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold text-center px-4 py-3 text-sm">
          Book a Pickup
        </a>
        <a
          href="tel:+16048491745"
          className="rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-4 py-3 text-sm flex items-center gap-1.5"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
      </div>
    </div>
  );
}