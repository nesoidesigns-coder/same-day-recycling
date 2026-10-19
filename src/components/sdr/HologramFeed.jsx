import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleQuestion, Truck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import AiMascot from "./AiMascot";
import AiMascotFull from "./AiMascotFull";

export default function HologramFeed() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      base44.functions
        .invoke("liveAiFeed", {})
        .then((res) => {
          if (active && res?.data?.events) setEvents(res.data.events);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const shown = events?.slice(0, 6) || [];

  return (
    <section className="bg-white py-16 md:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative z-10 flex justify-center">
          <AiMascotFull height={160} waveOnce className="-mb-9 rounded-2xl border-2 border-[#1d9e56]/60 bg-[#f4f7f5] shadow-[0_0_24px_rgba(29,158,86,0.5)] p-1" />
        </div>
        <div className="holo-flicker holo-panel relative rounded-2xl border border-[#1d9e56]/50 bg-[#041a10] shadow-[0_0_50px_rgba(29,158,86,0.35)] overflow-hidden">
          {/* sweeping light bar */}
          <div
            className="holo-scan absolute left-0 right-0 h-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(29,158,86,0.15), transparent)",
            }}
          ></div>

          {/* header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-[#1d9e56]/30">
            <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-[#1d9e56] holo-glow-text">
              <AiMascot size={44} />
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#1d9e56] opacity-60 animate-ping"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1d9e56]"></span>
              </span>
              AI Receptionist
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1d9e56] holo-glow-text">
              Live Feed
            </span>
          </div>

          {/* events */}
          <div className="relative px-5 py-4 space-y-3 min-h-[220px]">
            <AnimatePresence initial={false}>
              {shown.map((e, i) => (
                <motion.div
                  key={e.at + i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-start gap-3 rounded-xl border border-[#1d9e56]/25 bg-[#1d9e56]/10 px-4 py-3"
                >
                  <span className="mt-0.5 text-[#1d9e56]">
                    {e.type === "booking" ? (
                      <Truck className="w-4 h-4" />
                    ) : (
                      <MessageCircleQuestion className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#d6f5e4] leading-snug">
                      {e.text}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#1d9e56]/80">
                      {e.type === "booking" ? "Booking captured" : "Question answered"}
                      {e.city ? ` · ${e.city}` : ""} ·{" "}
                      {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {events && shown.length === 0 && (
              <p className="text-sm text-[#1d9e56]/70 text-center py-10 holo-glow-text">
                AI core online — awaiting the next visitor signal...
              </p>
            )}
            {!events && (
              <p className="text-sm text-[#1d9e56]/70 text-center py-10 holo-glow-text">
                Calibrating holographic display...
              </p>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Our AI receptionist answers visitors 24/7 — watch live questions and bookings stream in.
        </p>
      </div>
    </section>
  );
}