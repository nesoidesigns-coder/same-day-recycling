import { Truck, Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-[#102B2A] text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <Truck className="w-4 h-4 text-[#187B65]" />
          <span>One Country. One Network. A Smarter Way to Recycle.</span>
        </div>
        <a href="tel:+16048491745" className="flex items-center gap-2 font-semibold hover:text-[#187B65] transition-colors">
          <Phone className="w-4 h-4 text-[#187B65]" />
          <span>Call or text: (604) 849-1745</span>
        </a>
      </div>
    </div>
  );
}