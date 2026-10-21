import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Sparkles, Loader2, Phone } from "lucide-react";

const AGENT_NAME = "platformGuide";
const GREETING =
  "Hi, I'm Rex, the platform guide. I can walk you through the entire system — the software OS, white-label options, pricing, onboarding and the AI built into it. What would you like to know?";
const STARTERS = [
  "Walk me through the entire system",
  "How does pricing work?",
  "What's the difference between a license and white-label?",
  "What AI is built in?",
];

export default function PlatformChat() {
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      try {
        const c = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: "Platform walkthrough" },
        });
        if (cancelled) return;
        setConv(c);
        unsub = base44.agents.subscribeToConversation(c.id, (data) => {
          const msgs = data.messages || [];
          setMessages(msgs);
          if (!msgs.length || msgs[msgs.length - 1].role === "assistant") setSending(false);
        });
      } catch (e) {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      unsub && unsub();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async (text) => {
    const t = (typeof text === "string" ? text : input).trim();
    if (!t || !conv || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: t }]);
    setSending(true);
    try {
      await base44.agents.addMessage(conv, { role: "user", content: t });
    } catch (e) {
      setSending(false);
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong on my side — please try again, or call (604) 849-1745." }]);
    }
  };

  return (
    <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-5 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-[#187B65]/20 text-[#54D9AE] flex items-center justify-center mascot-float">
          <Bot className="w-5 h-5" />
        </span>
        <div>
          <div className="font-bold text-[#54D9AE] flex items-center gap-2">
            Rex · Platform Guide <Sparkles className="w-3.5 h-3.5 text-[#187B65]" />
          </div>
          <div className="text-xs text-emerald-100/50">Ask anything about the system — live answers</div>
        </div>
      </div>

      {failed ? (
        <p className="text-sm text-emerald-100/60">
          The live guide is unavailable right now. Call{" "}
          <a href="tel:+16048491745" className="font-bold text-[#54D9AE]">(604) 849-1745</a>{" "}
          and the team will walk you through everything.
        </p>
      ) : (
        <>
          <div ref={scrollRef} className="rounded-2xl bg-[#051511]/60 border border-[#187B65]/20 p-4 h-80 sm:h-96 overflow-y-auto space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#187B65]/15 border border-[#187B65]/25 px-4 py-2.5 text-sm text-emerald-50 leading-relaxed">
                {GREETING}
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#187B65] text-[#102B2A] px-4 py-2.5 text-sm font-medium leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#187B65]/15 border border-[#187B65]/25 px-4 py-2.5 text-sm text-emerald-50 leading-relaxed">
                    <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-1 [&_ol]:my-1">
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-[#187B65]/15 border border-[#187B65]/25 px-4 py-2.5 flex items-center gap-2 text-sm text-emerald-100/60">
                  <Loader2 className="w-4 h-4 animate-spin text-[#54D9AE]" /> Rex is typing…
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 && !sending && (
            <div className="flex gap-2 overflow-x-auto py-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-3.5 py-2 text-xs font-semibold text-[#54D9AE] hover:bg-[#187B65]/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about plans, pricing, white-label, onboarding…"
              className="flex-1 rounded-xl border border-[#187B65]/30 bg-[#051511]/60 px-4 py-3 text-sm text-emerald-50 placeholder:text-emerald-100/40 focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim() || !conv}
              className="rounded-xl bg-[#187B65] text-[#102B2A] px-4 flex items-center justify-center hover:bg-[#125C4E] transition-colors disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-xs text-emerald-100/40 flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Prefer a human? Call (604) 849-1745 any time.
          </p>
        </>
      )}
    </div>
  );
}