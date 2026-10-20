import { MapPin } from "lucide-react";

export default function LocallyOwned() {
  return (
    <section className="bg-[#f4f7f5] border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center sm:text-left">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-[#1d9e56]/15 text-[#1d9e56] flex items-center justify-center">
          <MapPin className="w-5 h-5" />
        </span>
        <div>
          <h2 className="font-bold text-[#0c3b24] text-base md:text-lg">
            Built in BC — run with local partners
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            No call centers, no head-office handoffs. When you call or text (604) 849-1745, you reach our dispatch and the local crew serving your city — and the price stays local too.
          </p>
        </div>
      </div>
    </section>
  );
}