import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bot, Send, CheckCircle2, Circle, Sparkles, Phone, Loader2 } from "lucide-react";

const OPENING =
  "Hi, I'm Rex — the Same Day Recycling booking engine. Same-day pickup is confirmed in Vancouver, Burnaby, Surrey, Richmond and Coquitlam, and I accept inquiries from every city in Canada. Tell me what you need picked up and where. What are we clearing out today?";

const FIELD_ROWS = [
  ["name", "Name", true],
  ["phone", "Phone", true],
  ["address", "Pickup address", true],
  ["items_description", "Items", true],
  ["email", "Email (optional)", false],
  ["city", "City", true],
  ["preferred_date", "Preferred date (optional)", false],
  ["time_window", "Time window (optional)", false],
];

const STARTERS = [
  "I need an old fridge and a couch picked up tomorrow morning in Surrey",
  "Book a junk removal for a garage cleanout in Vancouver",
  "I have boxes and a mattress to recycle in Burnaby",
];

export default function AIBookingCenter() {
  const [messages, setMessages] = useState([{ role: "assistant", content: OPENING }]);
  const [collected, setCollected] = useState({});
  const [booked, setBooked] = useState(null);
  const [inquiry, setInquiry] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async (text) => {
    const msg = (typeof text === "string" ? text : input).trim();
    if (!msg || sending || booked || inquiry) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: msg }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const res = await base44.functions.invoke("aiBooking", {
        message: msg,
        collected,
        history: nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      });
      const data = res.data || {};
      if (data.collected) setCollected(data.collected);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Sorry, say that once more?" }]);
      if (data.booked) setBooked(data.booked);
      if (data.inquiry) setInquiry(true);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong on my side. Please try again, or call us at (604) 849-1745." },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Progress reflects booking-eligible readiness only — 100% means every
  // required field (including city) is collected, not merely half the form.
  const REQUIRED_ROWS = FIELD_ROWS.filter(([, , required]) => required);
  const done = REQUIRED_ROWS.filter(([, key]) => collected[key]).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f7f5] px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#187B65] mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Self-driven booking
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102B2A] tracking-tight">AI Booking Center</h1>
          <p className="mt-2 text-slate-600 max-w-xl mx-auto">
            Book your pickup in one conversation. Rex collects the details and schedules the job — no forms, no
            waiting. Confirmed same-day booking in our five operator cities; every other Canadian city submits an
            inquiry — local service availability and scheduling are confirmed after your request.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[70vh] min-h-[480px]">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 bg-[#f4f7f5]">
              <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <div className="font-bold text-[#102B2A] leading-tight">Rex · AI Booking Agent</div>
                <div className="text-xs text-slate-500">{booked ? "Booking confirmed" : "Collecting your details"}</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-white">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#187B65] text-white rounded-br-md"
                        : "bg-[#f4f7f5] text-[#102B2A] rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-[#f4f7f5] px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Rex is working on it…
                  </div>
                </div>
              )}
            </div>

            {booked || inquiry ? (
              <div className="border-t border-slate-100 p-4 sm:p-6 bg-[#f4f7f5]">
                <div className="flex items-start gap-3 rounded-2xl bg-white border border-[#187B65]/30 p-4">
                  <CheckCircle2 className="w-6 h-6 text-[#187B65] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#102B2A]">{booked ? "Pickup booked — status: Confirmed" : "Inquiry received"}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      {booked ? (
                        <>Dispatch locks in the exact arrival window and updates you at every step.{!collected.email && " Add an email next time to get instant confirmations."}</>
                      ) : (
                        <>Same-day booking isn't confirmed in {collected.city} yet — your nationwide inquiry is saved, and local service availability and scheduling are confirmed after your request.</>
                      )}
                    </p>
                    <Link to="/" className="inline-block mt-2 text-sm font-bold text-[#187B65] hover:underline">
                      Back to home
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 p-3 sm:p-4 bg-white">
                {messages.length <= 2 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="shrink-0 rounded-full border border-[#187B65]/30 bg-[#f4f7f5] px-3.5 py-2 text-xs font-semibold text-[#102B2A] hover:bg-[#e8f2ec] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={booked ? "This booking is confirmed" : inquiry ? "Inquiry received" : "Type your reply…"}
                    disabled={!!booked || inquiry}
                    className="input flex-1"
                  />
                  <button
                    onClick={() => send()}
                    disabled={sending || !input.trim() || booked || inquiry}
                    className="rounded-xl bg-[#187B65] text-white px-4 flex items-center justify-center hover:bg-[#125C4E] transition-colors disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live booking summary */}
          <div className="rounded-3xl border border-slate-100 shadow-sm bg-white p-5 sm:p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#102B2A]">Your booking</h2>
              <span className="text-xs font-bold text-[#187B65]">{Math.round((done / REQUIRED_ROWS.length) * 100)}% ready to book</span>
            </div>
            <ul className="space-y-3">
              {FIELD_ROWS.map(([key, label, required]) => (
                <li key={key} className="flex items-start gap-2.5">
                  {collected[key] ? (
                    <CheckCircle2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#187B65] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-[18px] h-[18px] text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${collected[key] ? "text-[#102B2A]" : "text-slate-400"}`}>
                      {label}
                    </div>
                    {collected[key] && (
                      <div className="text-xs text-slate-500 break-words">{collected[key]}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Prefer a human? Call{" "}
              <a href="tel:+16048491745" className="font-bold text-[#187B65] inline-flex items-center gap-1">
                <Phone className="w-3 h-3" /> (604) 849-1745
              </a>{" "}
              — we're happy to book it for you.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}