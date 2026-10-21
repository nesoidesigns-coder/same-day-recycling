import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Paperclip, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AiMascot from "./AiMascot";
import AiMascotFull from "./AiMascotFull";
import ChatMedia from "./ChatMedia";

const AGENT_NAME = "receptionist";

function ChatAttachment({ url }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-2 text-xs font-semibold text-white underline">
        <FileText className="w-3.5 h-3.5" /> Document
      </a>
    );
  }
  return <img src={url} alt="Attachment" onError={() => setFailed(true)} className="w-24 h-24 object-cover rounded-lg border border-white/20" />;
}

export default function ReceptionistChat() {
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attached, setAttached] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
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

  useEffect(() => {
    if (sessionStorage.getItem("rex_greeted")) return;
    const timer = setTimeout(() => {
      setShowGreeting(true);
      sessionStorage.setItem("rex_greeted", "1");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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

  const pickFiles = () => fileInputRef.current?.click();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf").slice(0, 3);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        if (file_url) urls.push(file_url);
      }
      setAttached((a) => [...a, ...urls].slice(0, 3));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const send = async (preset) => {
    const text = (typeof preset === "string" ? preset : input).trim();
    if ((!text && !attached.length) || !conversation || sending || uploading) return;
    const file_urls = attached;
    setAttached([]);
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: text || "Here are photos of the junk.",
        ...(file_urls.length ? { file_urls } : {}),
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    setShowGreeting(false);
    if (!open && !conversation) start();
  };

  return (
    <>
      <div className="fixed bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] right-4 z-[60] flex items-center gap-3">
        {showGreeting && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full right-0 mb-3 w-56"
          >
            <div className="relative rounded-2xl rounded-br-md bg-white border border-[#187B65]/40 shadow-lg px-3.5 py-2.5 text-xs font-semibold text-[#102B2A] leading-snug">
              Hi, I'm Rex — ask me about recycling or book a pickup.
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
          </motion.div>
        )}
        <span className="hidden sm:inline-block rounded-full bg-white shadow-lg border border-slate-100 px-4 py-2 text-sm font-bold text-[#102B2A]">Chat with us</span>
        <button onClick={handleOpen} aria-label="Chat with us" className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105">
          {open ? (
            <span className="w-14 h-14 rounded-full bg-[#187B65] text-[#102B2A] flex items-center justify-center">
              <X className="w-6 h-6" />
            </span>
          ) : (
            <AiMascotFull height={56} />
          )}
        </button>
      </div>
      {open && (
        <div className="fixed bottom-[calc(5.75rem_+_env(safe-area-inset-bottom))] right-4 z-[60] w-[min(24rem,calc(100vw-2rem))] h-[min(28rem,calc(100dvh-8.5rem))] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-[#102B2A] text-white px-5 py-4 flex items-center gap-3">
            <AiMascot size={40} />
            <div>
              <div className="font-bold leading-tight">Rex · Same Day Recycling</div>
              <div className="flex items-center gap-1.5 text-xs text-[#187B65] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-[#187B65]" />Online · instant quotes &amp; booking</div>
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
                  <button key={chip} onClick={() => send(chip)} disabled={sending} className="rounded-full border border-[#187B65]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#102B2A] hover:bg-[#187B65]/10 transition-colors">
                    {chip}
                  </button>
                ))}
              </div>
            )}
            {messages.length === 0 && starting && (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#187B65] animate-spin" /></div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {m.role === "user"
                  ? <div className="bg-[#102B2A] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[85%]">
                      {m.file_urls?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {m.file_urls.map((u, j) => (
                            <ChatAttachment key={j} url={u} />
                          ))}
                        </div>
                      ) : null}
                      {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}
                    </div>
                  : <div className="bg-[#f4f7f5] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-700 max-w-[85%] prose prose-sm">
                      <ChatMedia content={m.content} />
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>}
              </div>
            ))}
            {sending && <div className="flex justify-start text-xs text-slate-400">typing…</div>}
            <div ref={bottomRef} />
          </div>
          {attached.length > 0 && (
            <div className="px-3 pt-2 flex gap-1.5">
              {attached.map((u, i) => (
                <button key={i} onClick={() => setAttached((a) => a.filter((_, j) => j !== i))} aria-label="Remove photo" className="relative">
                  <img src={u} alt="Attached" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                  <X className="w-3.5 h-3.5 absolute -top-1 -right-1 bg-white rounded-full border border-slate-200 text-slate-500" />
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-slate-100 p-3 flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFiles} />
            <button onClick={pickFiles} disabled={uploading || attached.length >= 3} aria-label="Attach photos" className="w-10 h-10 rounded-full border border-slate-200 text-[#102B2A] flex items-center justify-center hover:border-[#187B65] transition-colors disabled:opacity-50 shrink-0">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-[#187B65] focus:outline-none"
            />
            <button onClick={send} disabled={(!input.trim() && !attached.length) || sending || uploading} aria-label="Send" className="w-10 h-10 rounded-full bg-[#187B65] text-[#102B2A] flex items-center justify-center disabled:opacity-50 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}