import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AiMascot from "./AiMascot";
import AiMascotFull from "./AiMascotFull";

const AGENT_NAME = "receptionist";

export default function ReceptionistChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open || !conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [open, conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const start = async () => {
    setStarting(true);
    try {
      const conv = await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: "Website visitor" } });
      setConversation(conv);
      setMessages(conv.messages || []);
    } finally {
      setStarting(false);
    }
  };

  const send = async (preset) => {
    const text = (typeof preset === "string" ? preset : input).trim();
    if (!text || !conversation || sending) return;
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open && !conversation) start();
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3">
        <span className="hidden sm:inline-block rounded-full bg-white shadow-lg border border-slate-100 px-4 py-2 text-sm font-bold text-[#0c3b24]">Chat with us</span>
        <button onClick={handleOpen} aria-label="Chat with us" className="rounded-full shadow-lg transition-transform hover:scale-105">
          {open ? (
            <span className="w-14 h-14 rounded-full bg-[#1d9e56] text-[#0c3b24] flex items-center justify-center">
              <X className="w-6 h-6" />
            </span>
          ) : (
            <AiMascotFull height={76} className="drop-shadow-[0_0_16px_rgba(29,158,86,0.6)]" />
          )}
        </button>
      </div>
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-[#0c3b24] text-white px-5 py-4 flex items-center gap-3">
            <AiMascot size={40} />
            <div>
              <div className="font-bold leading-tight">Rex · Same Day Recycling</div>
              <div className="flex items-center gap-1.5 text-xs text-[#1d9e56] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-[#1d9e56]" />Online · instant quotes &amp; booking</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!messages.some((m) => m.role === "assistant") && (
              <div className="flex justify-start items-end gap-2">
                <AiMascotFull height={64} />
                <div className="bg-[#f4f7f5] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-700 max-w-[75%]">
                  Welcome to Same Day Recycling. I can give you an instant quote and book a same-day pickup. What do you need removed?
                </div>
              </div>
            )}
            {!messages.some((m) => m.role === "user") && !starting && (
              <div className="flex flex-wrap gap-2 pt-1">
                {["Get an instant quote", "Book a same-day pickup", "What can't you take?"].map((chip) => (
                  <button key={chip} onClick={() => send(chip)} disabled={sending} className="rounded-full border border-[#1d9e56]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#0c3b24] hover:bg-[#1d9e56]/10 transition-colors">
                    {chip}
                  </button>
                ))}
              </div>
            )}
            {messages.length === 0 && starting && (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" /></div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {m.role === "user"
                  ? <div className="bg-[#0c3b24] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap">{m.content}</div>
                  : <div className="bg-[#f4f7f5] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-700 max-w-[85%] prose prose-sm"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
              </div>
            ))}
            {sending && <div className="flex justify-start text-xs text-slate-400">typing…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-100 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-[#1d9e56] focus:outline-none"
            />
            <button onClick={send} disabled={!input.trim() || sending} aria-label="Send" className="w-10 h-10 rounded-full bg-[#1d9e56] text-[#0c3b24] flex items-center justify-center disabled:opacity-50 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}