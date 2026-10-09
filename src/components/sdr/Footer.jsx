import { Recycle, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-[#0c3b24]">
          <span className="w-8 h-8 rounded-lg bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Recycle className="w-4 h-4" />
          </span>
          <span>© 2026 Same Day Recycling — samedayrecycling.com</span>
        </div>
        <a href="tel:+16048491745" className="flex items-center gap-2 text-slate-700 font-medium hover:text-[#1d9e56] transition-colors">
          <Phone className="w-4 h-4 text-[#1d9e56]" />
          (604) 849-1745 · Licensed &amp; insured
        </a>
      </div>
    </footer>
  );
}