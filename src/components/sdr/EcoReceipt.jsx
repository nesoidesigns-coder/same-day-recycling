import { Recycle, HandHeart, Cpu, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const rows = [
  { icon: HandHeart, label: "Furniture & household goods", result: "Donated" },
  { icon: Recycle, label: "Metal & appliances", result: "Recycled" },
  { icon: Cpu, label: "Electronics", result: "Certified e-waste recycling" },
  { icon: Trash2, label: "Remaining debris", result: "Responsibly disposed" },
];

export default function EcoReceipt() {
  return (
    <section id="eco-receipt" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Recycling Receipt</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Know exactly where your stuff goes</h2>
          <p className="mt-4 text-slate-600">
            Every load is sorted for donation and recycling first — most never see the landfill. After your pickup
            we email you a PDF Impact Report showing exactly what from your haul was recycled or donated, and
            donation receipts are available on request. Commercial and office clients get a formal
            diversion-rate certificate with every job for their sustainability reporting.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors text-center">
              Book an eco pickup <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>
            <Link to="/recycling-centers" className="rounded-full border border-slate-200 text-[#0c3b24] font-bold px-7 py-3.5 hover:border-[#1d9e56] hover:text-[#1d9e56] transition-colors text-center">
              See our recycling network
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8 max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-dashed border-slate-200">
            <span className="w-10 h-10 rounded-xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
              <Recycle className="w-5 h-5" />
            </span>
            <div>
              <div className="font-bold text-[#0c3b24]">Recycling Receipt</div>
              <div className="text-xs text-slate-500">Emailed after every completed pickup</div>
            </div>
          </div>
          <div className="py-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-3 border-b border-dashed border-slate-100 last:border-0">
                <r.icon className="w-4 h-4 text-[#1d9e56] shrink-0" />
                <span className="text-sm text-slate-600 flex-1">{r.label}</span>
                <span className="text-sm font-bold text-[#0c3b24] text-right">{r.result}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-dashed border-slate-200 text-xs text-slate-500">
            Sorted for donation &amp; recycling first — landfill is the last resort.
          </div>
        </div>
      </div>
    </section>
  );
}