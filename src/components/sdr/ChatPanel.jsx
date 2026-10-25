import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2, Paperclip, FileText, Minus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AiMascot from "./AiMascot";
import AiMascotFull from "./AiMascotFull";
import ChatMedia from "./ChatMedia";
import RexOrb from "@/components/rex/RexOrb";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupRexContext, getPickupLocation, pickupLocationActions } from "@/lib/pickupLocationStore";

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

// The full Rex chat — loaded only when a visitor opens the launcher, keeping
// markdown/attachment/agent code out of the initial page bundle.
export default function ChatPanel({ onClose, preset }) {
  const pickup = usePickupLocation();
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
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStarting(true);
      try {
        const conv = await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: "Website visitor" } });
        if (cancelled) return;
        setConversation(conv);
        setMessages(conv.messages || []);
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Contextual assist: when a page opens Rex with a preset question, Rex
  // answers it first (only on a fresh conversation, and only once).
  const presetSentRef = useRef(null);
  useEffect(() => {
    if (!preset || !conversation?.id || starting || sending) return;
    if (presetSentRef.current === preset) return;
    presetSentRef.current = preset;
    send(preset);
  }, [preset, conversation?.id, starting, sending, messages.length]);

  const locationSentRef = useRef("");
  const locationKey = pickup ? `${pickup.selectionId}:${pickup.lat}:${pickup.lng}:${pickup.pinConfirmed}:${pickup.unit}` : "none";
  useEffect(() => {
    if (!pickup || !conversation?.id || starting || sending || (preset && presetSentRef.current !== preset) || locationSentRef.current === locationKey) return;
    locationSentRef.current = locationKey;
    send("Use my current pickup location and begin job preparation. Ask me whether the items are inside or outside.");
  }, [locationKey, conversation?.id, starting, sending, preset]);

  const pickFiles = () => fileInputRef.current?.click();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf").slice(0, 3);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        // Private storage: photos are not world-readable; access is via short-lived signed URLs
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        if (file_uri) {
          let signed_url = file_uri;
          try {
            signed_url = (await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 604800 })).signed_url;
          } catch {
            signed_url = (await base44.integrations.Core.CreateFileSignedUrl({ file_uri })).signed_url;
          }
          urls.push(signed_url || file_uri);
        }
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
    const currentPickup = getPickupLocation();
    const customerTyped = typeof preset !== "string";
    if (customerTyped && currentPickup?.pinConfirmed && text) {
      const note = [currentPickup.preparation.note, `Customer told Rex: ${text}`].filter(Boolean).join("\n").slice(-1000);
      pickupLocationActions.setPreparation({ ...currentPickup.preparation, note });
    }
    locationSentRef.current = currentPickup ? `${currentPickup.selectionId}:${currentPickup.lat}:${currentPickup.lng}:${currentPickup.pinConfirmed}:${currentPickup.unit}` : "none";
    setAttached([]);
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: `${text || "Here are photos of the junk."}\n\n[Current booking-form context]\n${pickupRexContext(currentPickup)}`,
        ...(file_urls.length ? { file_urls } : {}),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed z-[60] inset-x-2 bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4 sm:bottom-[calc(5.75rem_+_env(safe-area-inset-bottom))] sm:w-[min(24rem,calc(100vw-2rem))] h-[min(32rem,calc(100dvh-4.5rem-env(safe-area-inset-bottom)))] sm:h-[min(28rem,calc(100dvh-8.5rem))] bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
      <div className="bg-[#102B2A] text-white px-4 sm:px-5 py-3 flex items-center gap-3">
        <AiMascot size={36} />
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-tight text-sm sm:text-base">Rex · Same Day Recycling</div>
          <div className="min-w-0 overflow-hidden">
            <RexOrb state={sending ? "processing" : "idle"} size={12} label={sending ? "Thinking…" : "Online · 24/7 booking"} className="text-xs text-[#187B65] whitespace-nowrap" />
          </div>
        </div>
        <button onClick={onClose} aria-label="Minimize chat" className="ml-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0">
          <Minus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-[#f4f7f5] px-3 sm:px-4 py-2 text-xs">
        <span className="font-semibold text-slate-500">Chat with Rex on</span>
        <a href={base44.agents.getWhatsAppConnectURL(AGENT_NAME)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-bold text-[#102B2A] hover:border-[#187B65] transition-colors">
          <MessageCircle className="w-3.5 h-3.5 text-[#187B65]" /> WhatsApp
        </a>
        <a href={base44.agents.getTelegramConnectURL(AGENT_NAME)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-bold text-[#102B2A] hover:border-[#187B65] transition-colors">
          <Send className="w-3.5 h-3.5 text-[#187B65]" /> Telegram
        </a>
      </div>
      {pickup && <div className="border-b border-border bg-muted px-4 py-2 text-xs text-foreground"><strong>{pickup.pinConfirmed ? "Confirmed pickup" : "Pickup pin needs confirmation"}:</strong> {pickup.formattedAddress}</div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!messages.some((m) => m.role === "assistant") && (
          <div className="flex justify-start items-end gap-2">
            <AiMascotFull height={64} />
            <div className="bg-[#f4f7f5] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-700 max-w-[75%]">
              Hey! I'm Rex. Need something picked up? Tell me what you've got, and I'll help you figure out the next step.
            </div>
          </div>
        )}
        {!messages.some((m) => m.role === "user") && !starting && (
          <div className="flex flex-wrap gap-2 pt-1">
            {["What do you take?", "Estimate my load", "Book a pickup", "Do you serve my area?"].map((chip) => (
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
          className="flex-1 min-w-0 rounded-full border border-slate-200 px-4 py-2.5 text-base sm:text-sm focus:border-[#187B65] focus:outline-none"
        />
        <button onClick={send} disabled={(!input.trim() && !attached.length) || sending || uploading} aria-label="Send" className="w-10 h-10 rounded-full bg-[#187B65] text-[#102B2A] flex items-center justify-center disabled:opacity-50 shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}