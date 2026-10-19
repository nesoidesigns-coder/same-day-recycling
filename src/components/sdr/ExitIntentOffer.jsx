import { useEffect, useState } from "react";
import { X, Phone, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExitIntentOffer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("sdr_exit_offer_seen")) return;
    const onLeave = (e) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("sdr_exit_offer_seen")) {
        sessionStorage.setItem("sdr_exit_offer_seen", "1");
        setOpen(true);
        base44.analytics.track("exit_intent_shown", {});
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  if (!open) return null;

  const goQuote = () => {
    setOpen(false);
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0c3b24]/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative rounded-3xl bg-white max-w-sm w-full p-8 shadow-2xl text-center">
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200">
          <X className="w-4 h-4 text-slate-600" />
        </button>
        <span className="inline-flex w-12 h-12 rounded-2xl bg-[#1d9e56]/15 items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-[#1d9e56]" />
        </span>
        <h3 className="text-2xl font-bold text-[#0c3b24] leading-tight">Wait — your junk isn't gone yet.</h3>
        <p className="mt-3 text-slate-600 text-sm leading-relaxed">
          Get an instant quote in 30 seconds. Book before noon and the crew hauls it <span className="font-bold text-[#0c3b24]">this afternoon</span> — no hidden fees, price approved before we lift a thing.
        </p>
        <button onClick={goQuote} className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3.5 hover:bg-[#17a04c] transition-colors">
          Get my instant quote
        </button>
        <a href="tel:+16048491745" className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#0c3b24] hover:text-white transition-colors">
          <Phone className="w-4 h-4" /> Call (604) 849-1745
        </a>
      </div>
    </div>
  );
}