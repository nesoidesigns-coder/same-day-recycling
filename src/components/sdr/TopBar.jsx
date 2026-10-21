import { Truck } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-[#102B2A] text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-sm font-medium tracking-wide w-full">
          <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#187B65] shrink-0" />
          <span className="truncate">One Country. One Network. A Smarter Way to Recycle.</span>
        </div>
      </div>
    </div>
  );
}