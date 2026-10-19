import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function QuoteLeadCapture({ itemsText, estimate, city }) {
  const [contact, setContact] = useState("");
  const [state, setState] = useState("idle");

  const submit = async () => {
    if (!contact.trim() || state === "loading") return;
    setState("loading");
    try {
      await base44.functions.invoke("quoteLead", {
        contact: contact.trim(),
        items_text: itemsText,
        estimate,
        city,
      });
      base44.analytics.track("quote_lead_captured", { city: city || "" });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mt-4 border-t border-white/20 pt-4 flex items-center gap-2 text-sm text-[#1d9e56] font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Sent — we'll follow up within 30 minutes to lock in your price.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-white/20 pt-4">
      <p className="text-sm text-slate-300 mb-2">
        Not ready to book? Leave your number or email and we'll hold this quote for you.
      </p>
      <div className="flex gap-2">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Phone or email"
          className="flex-1 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1d9e56]"
        />
        <button
          onClick={submit}
          disabled={state === "loading" || !contact.trim()}
          className="rounded-full bg-white text-[#0c3b24] font-bold px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-xs text-red-300">Couldn't save it — call (604) 849-1745 and we'll take it over the phone.</p>}
    </div>
  );
}