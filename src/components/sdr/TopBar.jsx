import { Phone, Clock, MapPin } from "lucide-react";

// Global top strip: contact details and presence indicators visible on every
// page without scrolling (verified business facts, no marketing filler).
export default function TopBar() {
  return (
    <div className="bg-ri-forest text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-4">
        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-sm font-medium tracking-wide w-full sm:w-auto">
          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ri-mint shrink-0" />
          <a href="tel:+16048491745" className="font-bold text-white hover:text-ri-amber transition-colors">(604) 849-1745</a>
          <span className="hidden md:inline text-ri-ivory/60">One Country. One Network. A Smarter Way to Recycle.</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-medium text-ri-ivory/70 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ri-mint shrink-0" />
            Online requests 24/7
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-ri-mint shrink-0" />
            Requests accepted across Canada
          </span>
        </div>
      </div>
    </div>
  );
}