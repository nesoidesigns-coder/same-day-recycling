import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SmsThread({ phone, messages, onSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("smsSend", { action: "custom", to: phone, body: text.trim() });
      if (res?.data && res.data.ok === false) throw new Error(res.data.error || "Send failed");
      setText("");
      onSent();
    } catch {
      setError("Send failed — Twilio isn't fully configured yet. Add the sending number on the Secrets page.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <div className="font-bold text-[#102B2A] text-sm">{phone}</div>
          <div className="text-[11px] text-slate-400">Reply sends a real SMS via Twilio</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
                m.direction === "outbound"
                  ? "bg-[#187B65] text-white rounded-br-sm"
                  : "bg-[#f4f7f5] text-[#102B2A] rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <div className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${m.direction === "outbound" ? "text-white/60" : "text-slate-400"}`}>
                {m.role} · {m.status}
                {m.booking_id ? ` · job ${m.booking_id.slice(0, 6)}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a reply…"
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-xl bg-[#187B65] text-white px-4 py-2.5 font-bold text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {error && <div className="px-3 pb-3 text-xs text-red-600">{error}</div>}
    </div>
  );
}