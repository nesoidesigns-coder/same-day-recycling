import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";

export default function MetalPickupBand() {
  return (
    <section className="bg-[#1d9e56] text-[#0c3b24]">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center shrink-0">
            <Recycle className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">FREE Metal Pickup — Vancouver.</h2>
            <p className="font-semibold">We haul it, you pay $0.</p>
          </div>
        </div>
        <Link
          to="/free-metal-pickup"
          className="rounded-full bg-[#0c3b24] text-white font-bold px-7 py-4 hover:bg-[#0a3020] transition-colors shrink-0"
        >
          Get Free Metal Pickup
        </Link>
      </div>
    </section>
  );
}