import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
      const conv = base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: "Website visitor" } });
      setConversation(conv);
      setMessages(conv.messages || []);
      await base44.agents.addMessage(conv, { role: "user", content: "Hi!" });
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    const text = input.trim();
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
      <button onClick={handleOpen} aria-label="Chat with us" className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-[#1d9e56] text-[#0c3b24] shadow-lg hover:bg-[#17a04c] transition-colors flex items-center justify-center">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-[#0c3b24] text-white px-5 py-4">
            <div className="font-bold">Same Day Recycling</div>
            <div className="text-xs text-[#1d9e56] font-semibold">Ask anything · Book a pickup</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && starting && (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" /></div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {m.role === "user"
                  ? <div className="bg-[#1d9e56] text-[#0c3b24] rounded-2xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap">{m.content}</div>
                  : <div className="prose prose-sm max-w-[85%] text-slate-700"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
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