import { Suspense, lazy, useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import AiMascotFull from "./AiMascotFull";

// Only the launcher is part of the critical page load — the chat panel
// (markdown, attachments, agent conversation) loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel"));

export default function ReceptionistChat() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rex_greeted")) return;
    const timer = setTimeout(() => {
      setShowGreeting(true);
      sessionStorage.setItem("rex_greeted", "1");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    setShowGreeting(false);
  };

  // Any page button can open Rex with a "rex:open" window event
  // (e.g. the hero's "Ask Rex" action).
  useEffect(() => {
    const openRex = () => { setOpen(true); setShowGreeting(false); };
    window.addEventListener("rex:open", openRex);
    return () => window.removeEventListener("rex:open", openRex);
  }, []);

  // The Command Centre's admin pages are working dashboards — the floating Rex
  // launcher never covers them there. Rex stays on every customer-facing page,
  // and admin intelligence panels (Rex Monitor, Rex Intelligence Ask) are
  // untouched. This must remain after every hook.
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <div className="fixed bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] right-4 z-[60] flex items-center gap-3">
        {showGreeting && !open && (
          <div className="hidden sm:block absolute bottom-full right-0 mb-3 w-56">
            <div className="relative rounded-2xl rounded-br-md bg-white border border-[#187B65]/40 shadow-lg px-3.5 py-2.5 text-xs font-semibold text-[#102B2A] leading-snug">
              Hey! I'm Rex from Same Day Recycling. Need something picked up? I can help you estimate, book and track — any time.
              <button
                onClick={handleOpen}
                className="mt-1.5 block text-[11px] font-black uppercase tracking-wider text-[#187B65]"
              >
                Chat →
              </button>
              <button
                onClick={() => setShowGreeting(false)}
                aria-label="Dismiss greeting"
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}
        {!open && !showGreeting && (
          <button
            onClick={handleOpen}
            className="sm:hidden absolute bottom-full right-0 mb-3 flex items-center gap-2 rounded-full bg-white shadow-lg border border-slate-100 px-3.5 py-2 text-sm font-bold text-[#102B2A]"
          >
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#187B65] opacity-60 animate-ping" />
              <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#187B65]" />
            </span>
            Online Now
          </button>
        )}
        <span className="hidden sm:flex items-center gap-2 rounded-full bg-white shadow-lg border border-slate-100 px-4 py-2 text-sm font-bold text-[#102B2A]">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#187B65] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#187B65]" />
          </span>
          Online Now
        </span>
        <button onClick={handleOpen} aria-label="Chat with us" className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105">
          {open ? (
            <span className="w-14 h-14 rounded-full bg-[#187B65] text-[#102B2A] flex items-center justify-center">
              <X className="w-6 h-6" />
            </span>
          ) : (
            <AiMascotFull height={56} eager />
          )}
        </button>
      </div>
      {open && (
        <Suspense fallback={
          <div className="fixed z-[60] inset-x-2 bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4 sm:bottom-[calc(5.75rem_+_env(safe-area-inset-bottom))] sm:w-[min(24rem,calc(100vw-2rem))] h-[min(32rem,calc(100dvh-4.5rem-env(safe-area-inset-bottom)))] sm:h-[min(28rem,calc(100dvh-8.5rem))] bg-white rounded-3xl rounded-t-2xl shadow-2xl border border-slate-100 flex items-center justify-center" role="status" aria-label="Opening chat">
            <X className="w-5 h-5 text-slate-300 animate-pulse" />
          </div>
        }>
          <ChatPanel onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}