import { Suspense, lazy, useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

// Compact, accessible chat launcher. One 48px button, bottom-right, above the
// safe area. The open panel has its own minimize control, so the launcher
// steps aside while the chat is open and never covers booking inputs.
const ChatPanel = lazy(() => import("./ChatPanel"));

export default function ReceptionistChat() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Any page button can open Rex with a "rex:open" window event.
  useEffect(() => {
    const openRex = () => setOpen(true);
    window.addEventListener("rex:open", openRex);
    return () => window.removeEventListener("rex:open", openRex);
  }, []);

  // The Command Centre's admin pages are working dashboards — the floating
  // launcher never appears there.
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with Rex"
          className="fixed bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] right-3 z-[60] flex w-12 h-12 items-center justify-center rounded-full bg-[#187B65] text-white shadow-lg border-2 border-white hover:bg-[#125C4E] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}
      {open && (
        <Suspense fallback={
          <div className="fixed z-[60] inset-x-2 bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4 sm:bottom-[calc(5.75rem_+_env(safe-area-inset-bottom))] sm:w-[min(24rem,calc(100vw-2rem))] h-[min(32rem,calc(100dvh-4.5rem-env(safe-area-inset-bottom)))] sm:h-[min(28rem,calc(100dvh-8.5rem))] bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-center" role="status" aria-label="Opening chat">
            <MessageCircle className="w-5 h-5 text-slate-300 animate-pulse" />
          </div>
        }>
          <ChatPanel onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}